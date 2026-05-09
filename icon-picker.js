import { ICON_LIBRARY } from './icon-library.js'
import { iconHTML, EMOJI_PRESETS, fetchAndCacheIcon, searchIconify, getIconCache } from './icon-render.js'

let modal = null
let onPick = null
let activeTab = 'library'
let extEnabled = false
let searchTimer = null

export function configureExtIcons (enabled) {
  extEnabled = !!enabled
  if (modal) {
    const onlineTab = modal.querySelector('[data-tab="online"]')
    if (onlineTab) onlineTab.style.display = extEnabled ? '' : 'none'
  }
}

export function openIconPicker (currentValue, callback) {
  onPick = callback
  ensureModal()
  modal.classList.add('open')
  modal.querySelector('.ip-search').value = ''
  setTab(activeTab === 'online' && !extEnabled ? 'library' : activeTab)
  modal.querySelector('.ip-custom-input').value = currentValue || ''
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
        <button data-tab="library" class="ip-tab">内置 (${Object.keys(ICON_LIBRARY).length})</button>
        <button data-tab="online" class="ip-tab" style="display:none">在线搜索 (Iconify)</button>
        <button data-tab="emoji" class="ip-tab">Emoji</button>
        <button data-tab="custom" class="ip-tab">自定义文本</button>
      </div>
      <input type="text" class="ip-search" placeholder="搜索（如 github、database、cloud、shield）">
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
        <span class="ip-credit">图标来自 <a href="https://simpleicons.org" target="_blank">Simple Icons</a> · <a href="https://lucide.dev" target="_blank">Lucide</a> · <a href="https://iconify.design" target="_blank">Iconify</a></span>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  modal.querySelector('.ip-backdrop').addEventListener('click', close)
  modal.querySelector('.ip-close').addEventListener('click', close)
  modal.querySelectorAll('.ip-tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)))
  modal.querySelector('.ip-search').addEventListener('input', () => {
    const q = modal.querySelector('.ip-search').value
    if (activeTab === 'online') {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(() => renderOnlineGrid(q), 300)
    } else {
      renderGrid(q)
    }
  })
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
  if (extEnabled) modal.querySelector('[data-tab="online"]').style.display = ''
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
    if (tab === 'online') {
      search.placeholder = '在 200,000+ 图标中搜索（至少 2 个字符）…'
      renderOnlineGrid(search.value)
    } else {
      search.placeholder = '搜索（如 github、database、cloud、shield）'
      renderGrid(search.value)
    }
  }
}

function renderGrid (filter) {
  const grid = modal.querySelector('.ip-grid')
  const meta = modal.querySelector('.ip-meta')
  grid.innerHTML = ''
  filter = (filter || '').trim().toLowerCase()
  const items = []
  if (activeTab === 'library') {
    // bundled library + already-cached online icons
    const cache = getIconCache()
    const all = { ...ICON_LIBRARY }
    for (const [k, svg] of Object.entries(cache)) {
      if (!all[k]) all[k] = { label: k.split(':')[1] || k, category: 'cached', svg }
    }
    for (const [key, def] of Object.entries(all)) {
      if (filter && !key.toLowerCase().includes(filter) && !def.label.toLowerCase().includes(filter)) continue
      items.push({ key, label: def.label, html: def.svg, category: def.category })
    }
  } else if (activeTab === 'emoji') {
    for (const e of EMOJI_PRESETS) {
      if (filter && !e.includes(filter)) continue
      items.push({ key: e, label: e, html: e })
    }
  }
  for (const it of items) {
    const cell = document.createElement('button')
    cell.className = 'ip-cell'
    cell.title = it.key
    cell.innerHTML = `<span class="ip-cell-icon">${it.html}</span><span class="ip-cell-label">${escapeHtml(it.label)}</span>`
    cell.addEventListener('click', () => pick(it.key))
    grid.appendChild(cell)
  }
  meta.textContent = `${items.length} 个图标` + (filter ? `（搜索 "${filter}"）` : '')
}

async function renderOnlineGrid (filter) {
  const grid = modal.querySelector('.ip-grid')
  const meta = modal.querySelector('.ip-meta')
  filter = (filter || '').trim()
  if (filter.length < 2) {
    grid.innerHTML = ''
    meta.textContent = '请输入至少 2 个字符开始在线搜索'
    return
  }
  meta.textContent = `搜索 "${filter}" …`
  grid.innerHTML = ''
  let results
  try {
    results = await searchIconify(filter)
  } catch (err) {
    meta.textContent = '搜索失败：' + (err.message || err)
    return
  }
  if (!results.length) {
    meta.textContent = `没有找到 "${filter}"`
    return
  }
  for (const r of results) {
    const cell = document.createElement('button')
    cell.className = 'ip-cell'
    cell.title = r.key
    // use Iconify CDN as preview img — img-src is allowed by default CSP
    const previewUrl = `https://api.iconify.design/${r.collection}/${r.label}.svg`
    cell.innerHTML = `<span class="ip-cell-icon"><img src="${previewUrl}" alt="" style="width:22px;height:22px"></span><span class="ip-cell-label">${escapeHtml(r.label)}</span>`
    cell.addEventListener('click', async () => {
      cell.disabled = true
      cell.style.opacity = '0.5'
      try {
        await fetchAndCacheIcon(r.key)
        pick(r.key)
      } catch (err) {
        meta.textContent = '下载图标失败：' + (err.message || err)
        cell.disabled = false
        cell.style.opacity = ''
      }
    })
    grid.appendChild(cell)
  }
  meta.textContent = `${results.length} 个结果（点击下载并使用，会缓存到本地）`
}

function pick (value) {
  if (onPick) onPick(value)
  close()
}

function escapeHtml (s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
