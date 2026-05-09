import { getState, mergeRules, findLinks } from './rules-engine.js'
import { iconHTML } from './icon-render.js'

document.getElementById('open-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage()
})

async function render () {
  const content = document.getElementById('content')
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const url = tab && tab.url
  if (!url) {
    content.innerHTML = '<div class="empty">无法读取当前标签页 URL</div>'
    return
  }
  const state = await getState()
  const ruleSet = mergeRules(state)
  const matches = findLinks(url, ruleSet, state.disabled)
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

render()
