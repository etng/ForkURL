import { ICON_LIBRARY } from './icon-library.js'
import { iconHTML, EMOJI_PRESETS } from './icon-render.js'

let modal = null
let onPick = null
let activeTab = 'library'

export function openIconPicker (currentValue, callback) {
  onPick = callback
  ensureModal()
  modal.classList.add('open')
  modal.querySelector('.ip-search').value = ''
  setTab(activeTab)
  highlightCurrent(currentValue)
  setTimeout(() => modal.querySelector('.ip-search').focus(), 0)
}

function close () {
  if (modal) modal.classList.remove('open')
  onPick = null
}

function ensureModal () {
  if (modal) return
  modal = document.createElement('div')
  modal.className = 'ip-modal'
  modal.innerHTML = `
    <div class="ip-backdrop"></div>
    <div class="ip-dialog" role="dialog" aria-label="选择图标">
      <div class="ip-head">
        <strong>选择图标</strong>
        <button class="ip-close" aria-label="关闭">×</button>
      </div>
      <div class="ip-tabs">
        <button data-tab="library" class="ip-tab">图标库</button>
        <button data-tab="emoji" class="ip-tab">Emoji</button>
        <button data-tab="custom" class="ip-tab">自定义文本</button>
      </div>
      <input type="text" class="ip-search" placeholder="搜索（如 github、cloud、shield）">
      <div class="ip-grid"></div>
      <div class="ip-custom" style="display:none">
        <p style="font-size:12px;color:#57606a;margin-bottom:6px">输入任意 emoji 或文本作为图标。</p>
        <div style="display:flex;gap:8px">
          <input type="text" class="ip-custom-input" placeholder="🌐 或 ABC" style="flex:1;padding:6px 10px;border:1px solid #d0d7de;border-radius:6px">
          <button class="ip-custom-ok primary">使用</button>
        </div>
      </div>
      <div class="ip-foot">
        <span class="ip-meta"></span>
        <span class="ip-credit">图标来自 <a href="https://simpleicons.org" target="_blank">Simple Icons</a> · <a href="https://lucide.dev" target="_blank">Lucide</a></span>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  modal.querySelector('.ip-backdrop').addEventListener('click', close)
  modal.querySelector('.ip-close').addEventListener('click', close)
  modal.querySelectorAll('.ip-tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)))
  modal.querySelector('.ip-search').addEventListener('input', () => renderGrid(modal.querySelector('.ip-search').value))
  modal.querySelector('.ip-custom-ok').addEventListener('click', () => {
    const v = modal.querySelector('.ip-custom-input').value.trim()
    if (v) pick(v)
  })
  modal.querySelector('.ip-custom-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = e.target.value.trim()
      if (v) pick(v)
    }
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close()
  })
}

function setTab (tab) {
  activeTab = tab
  modal.querySelectorAll('.ip-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
  const grid = modal.querySelector('.ip-grid')
  const custom = modal.querySelector('.ip-custom')
  const search = modal.querySelector('.ip-search')
  if (tab === 'custom') {
    grid.style.display = 'none'
    custom.style.display = ''
    search.style.display = 'none'
  } else {
    grid.style.display = ''
    custom.style.display = 'none'
    search.style.display = ''
    renderGrid(search.value)
  }
}

function renderGrid (filter) {
  const grid = modal.querySelector('.ip-grid')
  const meta = modal.querySelector('.ip-meta')
  grid.innerHTML = ''
  filter = (filter || '').trim().toLowerCase()
  const items = []
  if (activeTab === 'library') {
    for (const [key, def] of Object.entries(ICON_LIBRARY)) {
      if (filter && !key.toLowerCase().includes(filter) && !def.label.toLowerCase().includes(filter)) continue
      items.push({ key, label: def.label, html: def.svg })
    }
  } else {
    for (const e of EMOJI_PRESETS) {
      if (filter && !e.includes(filter)) continue
      items.push({ key: e, label: e, html: e })
    }
  }
  for (const it of items) {
    const cell = document.createElement('button')
    cell.className = 'ip-cell'
    cell.title = it.label
    cell.innerHTML = `<span class="ip-cell-icon">${it.html}</span><span class="ip-cell-label">${escapeHtml(it.label)}</span>`
    cell.addEventListener('click', () => pick(it.key))
    grid.appendChild(cell)
  }
  meta.textContent = `${items.length} 个图标` + (filter ? `（搜索 "${filter}"）` : '')
}

function highlightCurrent (value) {
  modal.querySelector('.ip-custom-input').value = value || ''
}

function pick (value) {
  if (onPick) onPick(value)
  close()
}

function escapeHtml (s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
