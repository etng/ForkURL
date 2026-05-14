const TELEMETRY_ENDPOINT = 'https://forkurl.0o666.xyz/api/telemetry'

const TELEMETRY_EVENTS = new Set([
  'install',
  'update',
  'daily_active',
  'popup_open',
  'jump_open',
  'options_open',
  'rules_refresh'
])

const INSTALLATION_ID_KEY = 'forkurl.telemetry.installationId.v1'
const ATTEMPTS_KEY = 'forkurl.telemetry.attempts.v1'
const REQUEST_TIMEOUT_MS = 2500
const MAX_STORED_ATTEMPTS = 140

function getUtcDay (date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function normalizeSegment (value, fallback = 'unknown') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || fallback
}

function isAutomatedEnvironment () {
  try {
    if (navigator.webdriver) return true
    return /HeadlessChrome|Playwright|Puppeteer|WebDriver/i.test(navigator.userAgent || '')
  } catch {
    return false
  }
}

function createInstallationId () {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  const values = new Uint8Array(16)
  crypto.getRandomValues(values)
  values[6] = (values[6] & 0x0f) | 0x40
  values[8] = (values[8] & 0x3f) | 0x80
  const hex = Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join('-')
}

async function getInstallationId () {
  const stored = await chrome.storage.local.get(INSTALLATION_ID_KEY)
  const existing = stored[INSTALLATION_ID_KEY]
  if (typeof existing === 'string' && existing) {
    return existing
  }

  const installationId = createInstallationId()
  await chrome.storage.local.set({
    [INSTALLATION_ID_KEY]: installationId
  })
  return installationId
}

function resolveBrowserFamily () {
  const userAgent = navigator.userAgent || ''
  if (/Edg\//.test(userAgent)) return 'edge'
  if (/Firefox\//.test(userAgent)) return 'firefox'
  if (/Chrome\//.test(userAgent) || /Chromium\//.test(userAgent)) return 'chrome'
  return 'unknown'
}

function resolveOsFamily () {
  const userAgentData = navigator.userAgentData
  const platform = (userAgentData && userAgentData.platform) || navigator.platform || navigator.userAgent || ''
  if (/mac/i.test(platform)) return 'macos'
  if (/win/i.test(platform)) return 'windows'
  if (/android/i.test(platform)) return 'android'
  if (/linux/i.test(platform)) return 'linux'
  if (/iphone|ipad|ios/i.test(platform)) return 'ios'
  return 'unknown'
}

function getLocale () {
  try {
    if (chrome.i18n && chrome.i18n.getUILanguage) {
      return chrome.i18n.getUILanguage()
    }
  } catch {}
  return navigator.language || 'unknown'
}

function getAttemptKey (eventName, eventDay, appVersion) {
  return `${eventDay}:${appVersion}:${eventName}`
}

async function readAttempts () {
  const stored = await chrome.storage.local.get(ATTEMPTS_KEY)
  const attempts = stored[ATTEMPTS_KEY]
  return attempts && typeof attempts === 'object' && !Array.isArray(attempts)
    ? attempts
    : {}
}

async function rememberAttempt (attemptKey) {
  const attempts = await readAttempts()
  attempts[attemptKey] = new Date().toISOString()

  const prunedAttempts = Object.fromEntries(
    Object.entries(attempts)
      .sort(([, left], [, right]) => String(right).localeCompare(String(left)))
      .slice(0, MAX_STORED_ATTEMPTS)
  )

  await chrome.storage.local.set({
    [ATTEMPTS_KEY]: prunedAttempts
  })
}

async function postTelemetryPayload (payload) {
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS)

  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload),
      credentials: 'omit',
      cache: 'no-store',
      signal: abortController.signal
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function trackTelemetryEvent (eventName, options = {}) {
  if (!TELEMETRY_EVENTS.has(eventName)) {
    return false
  }

  if (isAutomatedEnvironment()) {
    return false
  }

  const stored = await chrome.storage.local.get('telemetryEnabled')
  if (stored.telemetryEnabled === false) {
    return false
  }

  const eventDay = getUtcDay()
  const appVersion = chrome.runtime.getManifest().version
  const attemptKey = getAttemptKey(eventName, eventDay, appVersion)

  if (!options.force) {
    const attempts = await readAttempts()
    if (attempts[attemptKey]) {
      return false
    }
    await rememberAttempt(attemptKey)
  }

  const payload = {
    schemaVersion: 1,
    product: 'forkurl',
    eventName,
    eventDay,
    installationId: await getInstallationId(),
    appVersion: normalizeSegment(appVersion),
    locale: normalizeSegment(getLocale()),
    browserFamily: normalizeSegment(resolveBrowserFamily()),
    osFamily: normalizeSegment(resolveOsFamily())
  }

  if (options.previousVersion) {
    payload.previousVersion = normalizeSegment(options.previousVersion)
  }

  try {
    await postTelemetryPayload(payload)
    return true
  } catch {
    return false
  }
}

export async function clearTelemetryLocalState () {
  await chrome.storage.local.remove([
    INSTALLATION_ID_KEY,
    ATTEMPTS_KEY
  ])
}

export { TELEMETRY_ENDPOINT, TELEMETRY_EVENTS }
