import { getState, mergeRules, findLinks } from './rules-engine.js'
import { hydrateIconValues, iconHTML, loadIconCache } from './icon-render.js'

document.getElementById('open-options').addEventListener('click', async (event) => {
  event.preventDefault()
  await openOptionsPageFromPopup()
})

chrome.runtime.sendMessage({ type: 'track-telemetry', eventName: 'popup_open' })

async function render () {
  const content = document.getElementById('content')
  await loadIconCache()
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const url = tab && tab.url
  if (!url) {
    content.innerHTML = '<div class="empty">无法读取当前标签页 URL</div>'
    return
  }
  const state = await getState()
  const ruleSet = mergeRules(state)
  const matches = findLinks(url, ruleSet, state.disabled)
  if (state.extIcons) {
    await hydrateIconValues(matches.map(({ link }) => link.icon))
  }
  if (!matches.length) {
    content.innerHTML = '<div class="empty">此页面无可用跳转<br><br>可在「设置」中添加自定义规则<br>或配置远程规则源。</div>'
    return
  }

  // Group by groupId for visual sectioning when multiple groups match.
  const byGroup = new Map()
  for (const m of matches) {
    if (!byGroup.has(m.groupId)) byGroup.set(m.groupId, [])
    byGroup.get(m.groupId).push(m)
  }
  const groupNames = new Map()
  for (const g of ruleSet.groups) groupNames.set(g.id, g.name)

  const showGroupLabels = byGroup.size > 1
  const frag = document.createDocumentFragment()
  for (const [gid, items] of byGroup) {
    if (showGroupLabels) {
      const lbl = document.createElement('div')
      lbl.className = 'group-label'
      lbl.textContent = groupNames.get(gid) || gid
      frag.appendChild(lbl)
    }
    for (const { link } of items) {
      const a = document.createElement('a')
      a.className = 'btn'
      a.href = link.url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.title = link.desc || link.url
      a.innerHTML = `<span class="icon">${iconHTML(link.icon)}</span><span class="label">${escapeHtml(link.label)}</span>`
      a.addEventListener('click', (e) => {
        e.preventDefault()
        chrome.runtime.sendMessage({ type: 'track-telemetry', eventName: 'jump_open' })
        chrome.tabs.create({ url: link.url })
        window.close()
      })
      frag.appendChild(a)
    }
  }
  content.innerHTML = ''
  content.appendChild(frag)
}

function escapeHtml (s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

async function openOptionsPageFromPopup () {
  const optionsUrl = chrome.runtime.getURL('options.html')
  try {
    await openRuntimeOptionsPage()
    window.close()
    return
  } catch (error) {
    console.warn('Could not open options page via runtime API; opening direct tab instead.', error)
  }

  try {
    await chrome.tabs.create({ url: optionsUrl })
  } catch (error) {
    console.error('Could not open options page in a new tab.', error)
    window.open(optionsUrl, '_blank', 'noopener,noreferrer')
  }
  window.close()
}

function openRuntimeOptionsPage () {
  return new Promise((resolve, reject) => {
    if (!chrome.runtime.openOptionsPage) {
      reject(new Error('chrome.runtime.openOptionsPage is unavailable'))
      return
    }

    let settled = false
    const settle = (fn, value) => {
      if (settled) return
      settled = true
      fn(value)
    }

    try {
      const maybePromise = chrome.runtime.openOptionsPage(() => {
        const error = chrome.runtime.lastError
        if (error) settle(reject, error)
        else settle(resolve)
      })
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(() => settle(resolve), error => settle(reject, error))
      }
    } catch (error) {
      settle(reject, error)
    }
  })
}

render()
