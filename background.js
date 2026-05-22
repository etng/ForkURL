// Service worker: keep the toolbar action badge in sync with the active tab,
// and refresh remote rules periodically.

import { getState, mergeRules, findLinks, fetchRemoteRules } from './rules-engine.js'
import { clearTelemetryLocalState, trackTelemetryEvent } from './telemetry.js'
import { isMissingTabError } from './extension-errors.js'

const BADGE_BG = '#0969da'
const REFRESH_ALARM = 'url-switcher-remote-refresh'
const REFRESH_PERIOD_MIN = 60 * 6 // 6 hours

function ignoreAsyncError (promise, shouldIgnore = () => false) {
  promise.catch((error) => {
    if (shouldIgnore(error)) return
    console.warn('ForkURL background task failed', error)
  })
}

function updateBadgeForTabQuietly (tabId, url) {
  ignoreAsyncError(updateBadgeForTab(tabId, url), isMissingTabError)
}

async function updateBadgeForTab (tabId, url) {
  try {
    if (!url || !/^https?:/i.test(url)) {
      await chrome.action.setBadgeText({ tabId, text: '' })
      return
    }
    const state = await getState()
    const ruleSet = mergeRules(state)
    const matches = findLinks(url, ruleSet, state.disabled)
    if (matches.length > 0) {
      await chrome.action.setBadgeText({ tabId, text: String(matches.length) })
      await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_BG })
      if (chrome.action.setBadgeTextColor) {
        try { await chrome.action.setBadgeTextColor({ tabId, color: '#ffffff' }) } catch {}
      }
      await chrome.action.setTitle({ tabId, title: `URL Switcher · ${matches.length} 个跳转` })
    } else {
      await chrome.action.setBadgeText({ tabId, text: '' })
      await chrome.action.setTitle({ tabId, title: 'URL Switcher（此页面无可用跳转）' })
    }
  } catch (error) {
    if (isMissingTabError(error)) return
    throw error
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateBadgeForTabQuietly(tabId, tab.url || changeInfo.url)
  }
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    updateBadgeForTabQuietly(tabId, tab.url)
  } catch {}
})

chrome.runtime.onInstalled.addListener(async (details) => {
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: REFRESH_PERIOD_MIN })
  if (details.reason === 'install' || details.reason === 'update') {
    await trackTelemetryEvent(details.reason, {
      force: true,
      previousVersion: details.previousVersion
    })
  }
  await trackTelemetryEvent('daily_active')
  await refreshAllTabs()
})

chrome.runtime.onStartup.addListener(async () => {
  await trackTelemetryEvent('daily_active')
  await refreshAllTabs()
})

chrome.alarms?.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== REFRESH_ALARM) return
  await trackTelemetryEvent('daily_active')
  const { remoteUrl } = await getState()
  if (remoteUrl) {
    try {
      await fetchRemoteRules(remoteUrl)
      await trackTelemetryEvent('rules_refresh')
    }
    catch (err) {
      await chrome.storage.local.set({ remoteError: String(err && err.message || err) })
    }
    refreshAllTabs()
  }
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return
  if (changes.remoteRules || changes.customGroups || changes.disabled) {
    refreshAllTabs()
  }
  if (changes.telemetryEnabled?.newValue === false) {
    ignoreAsyncError(clearTelemetryLocalState())
  }
})

// Allow popup/options to request a manual remote refresh.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'refresh-remote') {
    (async () => {
      try {
        const { remoteUrl } = await getState()
        const rules = await fetchRemoteRules(remoteUrl)
        await trackTelemetryEvent('rules_refresh')
        refreshAllTabs()
        sendResponse({ ok: true, count: rules.groups.length })
      } catch (err) {
        const message = String(err && err.message || err)
        await chrome.storage.local.set({ remoteError: message })
        sendResponse({ ok: false, error: message })
      }
    })()
    return true
  }
  if (msg && msg.type === 'track-telemetry') {
    (async () => {
      const ok = await trackTelemetryEvent(msg.eventName)
      sendResponse({ ok })
    })()
    return true
  }
})

async function refreshAllTabs () {
  try {
    const tabs = await chrome.tabs.query({})
    for (const t of tabs) {
      if (t.id != null) updateBadgeForTabQuietly(t.id, t.url)
    }
  } catch {}
}

// Permissions for chrome.alarms — declare at runtime if missing.
// (alarms permission is optional in this build; falling back to install/startup-only refresh if absent.)
