import { ICON_LIBRARY } from './icon-library.js'

// Synchronous icon cache mirror of chrome.storage.local["iconCache"].
// Call loadIconCache() once per page (popup/options) before rendering.
let cachedIcons = {}
const failedIconKeys = new Set()
const pendingIconFetches = new Map()
const ICON_KEY_RE = /^[\w-]+:[\w.-]+$/
const AUTO_FETCH_PREFIXES = new Set(['simple', 'lucide'])
const DEFAULT_ICON_FALLBACK = '↗'

export async function loadIconCache () {
  try {
    const data = await chrome.storage.local.get('iconCache')
    cachedIcons = data.iconCache || {}
  } catch {
    cachedIcons = {}
  }
}

// Returns trusted innerHTML for an icon value.
// Resolution order: bundled library → runtime cache → plain text/emoji.
export function iconHTML (value) {
  const key = normalizeIconKey(value)
  if (key) {
    if (ICON_LIBRARY[key]) return ICON_LIBRARY[key].svg
    if (cachedIcons[key]) return cachedIcons[key]
    if (isKnownIconRef(key)) return DEFAULT_ICON_FALLBACK
  }
  return escapeHtml(value || DEFAULT_ICON_FALLBACK)
}

export function isLibraryIcon (value) {
  const key = normalizeIconKey(value)
  return !!key && !!(ICON_LIBRARY[key] || cachedIcons[key])
}

export function normalizeIconKey (value) {
  if (typeof value !== 'string') return ''
  const key = value.trim()
  if (!ICON_KEY_RE.test(key)) return ''
  const i = key.indexOf(':')
  const prefix = key.slice(0, i)
  const name = key.slice(i + 1)
  const normalizedPrefix = prefix === 'lucid'
    ? 'lucide'
    : prefix === 'simple-icons'
      ? 'simple'
      : prefix
  return `${normalizedPrefix}:${name}`
}

// Convert our internal prefix to Iconify's collection slug.
// We use "simple:" / "lucide:" internally; Iconify expects "simple-icons" / "lucide".
export function toIconifyKey (key) {
  const normalized = normalizeIconKey(key)
  if (!normalized) return null
  const i = normalized.indexOf(':')
  if (i < 0) return null
  const prefix = normalized.slice(0, i)
  const name = normalized.slice(i + 1)
  const collection = prefix === 'simple' ? 'simple-icons' : prefix
  return { collection, name }
}

// Fetch a single icon SVG from Iconify, normalize, persist to cache.
export async function fetchAndCacheIcon (key) {
  const normalizedKey = normalizeIconKey(key)
  const ck = toIconifyKey(normalizedKey)
  if (!ck) throw new Error('图标 key 格式错误')
  const url = `https://api.iconify.design/${ck.collection}/${ck.name}.svg`
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  if (!text.startsWith('<svg')) throw new Error('返回内容不是 SVG（图标可能不存在）')
  const normalized = normalizeIconifySvg(text)
  cachedIcons[normalizedKey] = normalized
  await chrome.storage.local.set({ iconCache: cachedIcons })
  return normalized
}

export async function hydrateIconValues (values) {
  const keys = [...new Set((values || [])
    .map(normalizeIconKey)
    .filter(canAutoFetchIcon))]
  const hydrated = []
  await Promise.all(keys.map(async (key) => {
    if (pendingIconFetches.has(key)) {
      await pendingIconFetches.get(key)
      if (cachedIcons[key]) hydrated.push(key)
      return
    }
    const pending = fetchAndCacheIcon(key)
      .then(() => {
        failedIconKeys.delete(key)
        hydrated.push(key)
      })
      .catch(() => {
        failedIconKeys.add(key)
      })
      .finally(() => {
        pendingIconFetches.delete(key)
      })
    pendingIconFetches.set(key, pending)
    await pending
  }))
  return hydrated
}

function canAutoFetchIcon (key) {
  if (!key || ICON_LIBRARY[key] || cachedIcons[key] || failedIconKeys.has(key)) return false
  return isKnownIconRef(key)
}

function isKnownIconRef (key) {
  const prefix = key.slice(0, key.indexOf(':'))
  return AUTO_FETCH_PREFIXES.has(prefix)
}

// Search the Iconify registry. Returns array of { key, label }.
export async function searchIconify (query, { limit = 64 } = {}) {
  if (!query || query.length < 2) return []
  const url = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}&prefixes=lucide,simple-icons`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Iconify 搜索失败：HTTP ${res.status}`)
  const data = await res.json()
  return (data.icons || []).map(full => {
    // full is "simple-icons:github" → we store as "simple:github"
    const [coll, name] = full.split(':')
    const ourPrefix = coll === 'simple-icons' ? 'simple' : coll
    return { key: `${ourPrefix}:${name}`, label: name, collection: coll }
  })
}

export async function clearIconCache () {
  cachedIcons = {}
  await chrome.storage.local.set({ iconCache: {} })
}

export function getIconCache () {
  return cachedIcons
}

function normalizeIconifySvg (svg) {
  let s = svg.replace(/\s+/g, ' ').trim()
  // Replace any explicit width/height with 1em.
  s = s.replace(/<svg([^>]*)>/, (_, attrs) => {
    const a = attrs.replace(/\s(width|height)="[^"]*"/g, '')
    return `<svg width="1em" height="1em" aria-hidden="true"${a}>`
  })
  return s
}

function escapeHtml (s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export const EMOJI_PRESETS = [
  '🌐', '📄', '💻', '👁', '🔵', '☁️', '⚡', '📦',
  '📊', '🕸', '▶️', '🔐', '🧩', '📓', '🚀', '📡',
  '⚖️', '🏛', '🔍', '✨', '🛠', '🧪', '🔗', '📚',
  '🎯', '💡', '🔥', '⭐', '🚦', '📌', '🤖', '🧠'
]
