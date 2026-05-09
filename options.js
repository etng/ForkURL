import { getState, setState, mergeRules, isValidRuleSet, STORAGE_KEYS } from './rules-engine.js'

const $ = (id) => document.getElementById(id)

const DEFAULT_REMOTE_URL = 'https://raw.githubusercontent.com/etng/ForkURL/main/rules.json'

let workingCustomGroups = [] // editable copy until "Save"

async function init () {
  const state = await getState()

  $('remote-url').value = state.remoteUrl || ''
  renderRemoteStatus(state)

  $('use-default-source').addEventListener('click', () => {
    $('remote-url').value = DEFAULT_REMOTE_URL
  })

  $('save-url').addEventListener('click', async () => {
    const url = $('remote-url').value.trim()
    await setState({ [STORAGE_KEYS.remoteUrl]: url })
    renderRemoteStatus(await getState())
  })

  $('refresh-url').addEventListener('click', async () => {
    const url = $('remote-url').value.trim()
    await setState({ [STORAGE_KEYS.remoteUrl]: url })
    $('remote-status').textContent = '正在同步…'
    $('remote-status').className = 'meta'
    chrome.runtime.sendMessage({ type: 'refresh-remote' }, async (res) => {
      const s = await getState()
      renderRemoteStatus(s)
      if (res && !res.ok) {
        $('remote-status').textContent = '同步失败：' + res.error
        $('remote-status').className = 'meta error'
      }
      renderRuleTree()
    })
  })

  workingCustomGroups = deepClone(state.customGroups || [])
  renderCustomEditor()

  $('add-group').addEventListener('click', () => {
    workingCustomGroups.push({
      id: 'group-' + Math.random().toString(36).slice(2, 7),
      name: '新规则组',
      rules: []
    })
    renderCustomEditor()
  })

  $('save-custom').addEventListener('click', async () => {
    const wrapper = { groups: workingCustomGroups }
    if (!isValidRuleSet(wrapper)) {
      setStatus('custom-status', '校验失败：请检查每个规则至少有 1 个 pattern 与 1 个 link，且 url/label 都填写', 'error')
      return
    }
    await setState({ [STORAGE_KEYS.customGroups]: workingCustomGroups })
    setStatus('custom-status', `已保存（${workingCustomGroups.length} 个组）`, 'ok')
    renderRuleTree()
  })

  $('reset-custom').addEventListener('click', async () => {
    const s = await getState()
    workingCustomGroups = deepClone(s.customGroups || [])
    renderCustomEditor()
    setStatus('custom-status', '已恢复到上次保存', '')
  })

  $('export-btn').addEventListener('click', exportConfig)
  $('import-btn').addEventListener('click', () => $('import-file').click())
  $('import-file').addEventListener('change', importConfig)

  await renderRuleTree()
}

// ─── Remote status ─────────────────────────────────────────────────────────

function renderRemoteStatus (state) {
  const el = $('remote-status')
  if (!state.remoteUrl) {
    el.textContent = '未配置远程地址。点「使用官方源」可填入默认地址。'
    el.className = 'meta'
    return
  }
  if (state.remoteError) {
    el.textContent = '上次同步出错：' + state.remoteError
    el.className = 'meta error'
    return
  }
  if (state.remoteUpdatedAt) {
    const groups = state.remoteRules ? state.remoteRules.groups.length : 0
    el.textContent = `已同步：${groups} 个组 · ${new Date(state.remoteUpdatedAt).toLocaleString()}`
    el.className = 'meta ok'
  } else {
    el.textContent = '已保存地址，尚未同步'
    el.className = 'meta'
  }
}

// ─── Rule tree (enable/disable) ────────────────────────────────────────────

async function renderRuleTree () {
  const state = await getState()
  const ruleSet = mergeRules(state)
  const tree = $('rule-tree')
  tree.innerHTML = ''
  for (const group of ruleSet.groups) {
    tree.appendChild(renderGroup(group, state))
  }
}

function renderGroup (group, state) {
  const det = document.createElement('details')
  det.className = 'group'
  det.open = true

  const sum = document.createElement('summary')
  const cb = makeCheckbox(!state.disabled[group.id], async (checked) => {
    await toggleDisabled(group.id, !checked)
  })
  cb.addEventListener('click', (e) => e.stopPropagation())
  sum.appendChild(cb)
  const name = document.createElement('span')
  name.textContent = group.name + ' '
  sum.appendChild(name)
  const tag = document.createElement('span')
  tag.className = 'rule-pat'
  tag.textContent = `(${group.id})`
  sum.appendChild(tag)
  const badge = document.createElement('span')
  badge.className = 'badge'
  badge.style.marginLeft = 'auto'
  badge.textContent = `${group.rules.length} 规则`
  sum.appendChild(badge)
  det.appendChild(sum)

  const body = document.createElement('div')
  body.className = 'group-body'
  for (const rule of group.rules) {
    body.appendChild(renderRuleRow(group, rule, state))
  }
  det.appendChild(body)
  return det
}

function renderRuleRow (group, rule, state) {
  const ruleKey = `${group.id}/${rule.id}`
  const wrap = document.createElement('div')
  wrap.className = 'rule'

  const head = document.createElement('div')
  head.className = 'rule-head'
  const cb = makeCheckbox(!state.disabled[ruleKey], async (checked) => {
    await toggleDisabled(ruleKey, !checked)
  })
  head.appendChild(cb)
  const name = document.createElement('span')
  name.className = 'rule-name'
  name.textContent = rule.name || rule.id
  head.appendChild(name)
  const pat = document.createElement('span')
  pat.className = 'rule-pat'
  pat.textContent = rule.patterns.join(' | ')
  head.appendChild(pat)
  wrap.appendChild(head)

  const links = document.createElement('div')
  links.className = 'links'
  rule.links.forEach((link, idx) => {
    const linkId = link.id || String(idx)
    const linkKey = `${ruleKey}/${linkId}`
    const row = document.createElement('div')
    row.className = 'link-row'
    const lcb = makeCheckbox(!state.disabled[linkKey], async (checked) => {
      await toggleDisabled(linkKey, !checked)
    })
    row.appendChild(lcb)
    const ico = document.createElement('span')
    ico.textContent = link.icon || '↗'
    row.appendChild(ico)
    const lab = document.createElement('span')
    lab.textContent = link.label
    row.appendChild(lab)
    if (link.desc) {
      const d = document.createElement('span')
      d.className = 'desc'
      d.textContent = '— ' + link.desc
      row.appendChild(d)
    }
    links.appendChild(row)
  })
  wrap.appendChild(links)
  return wrap
}

function makeCheckbox (checked, onChange) {
  const label = document.createElement('label')
  label.className = 'cb'
  const cb = document.createElement('input')
  cb.type = 'checkbox'
  cb.checked = checked
  cb.addEventListener('change', () => onChange(cb.checked))
  label.appendChild(cb)
  return label
}

async function toggleDisabled (key, disabled) {
  const state = await getState()
  const next = { ...(state.disabled || {}) }
  if (disabled) next[key] = true
  else delete next[key]
  await setState({ [STORAGE_KEYS.disabled]: next })
}

// ─── Structured custom-rule editor ─────────────────────────────────────────

function renderCustomEditor () {
  const root = $('custom-editor')
  root.innerHTML = ''
  if (!workingCustomGroups.length) {
    const hint = document.createElement('div')
    hint.className = 'empty-hint'
    hint.textContent = '还没有自定义规则。点上方「+ 添加组」开始。'
    root.appendChild(hint)
    return
  }
  workingCustomGroups.forEach((g, gi) => root.appendChild(buildGroupCard(g, gi)))
}

function buildGroupCard (group, gi) {
  const card = document.createElement('div')
  card.className = 'cgroup'

  const head = document.createElement('div')
  head.className = 'cgroup-head'
  head.appendChild(makeInput('name-input', group.name, '组名称', (v) => { group.name = v }))
  head.appendChild(makeInput('id-input', group.id, '唯一 id', (v) => { group.id = v }))
  const addRule = document.createElement('button')
  addRule.textContent = '+ 规则'
  addRule.onclick = () => {
    group.rules.push({
      id: 'rule-' + Math.random().toString(36).slice(2, 7),
      name: '新规则',
      patterns: [''],
      links: [{ id: 'link-1', label: '', icon: '↗', url: '', desc: '' }]
    })
    renderCustomEditor()
  }
  head.appendChild(addRule)
  const delGroup = document.createElement('button')
  delGroup.className = 'subtle danger'
  delGroup.textContent = '删除组'
  delGroup.onclick = () => {
    if (!confirm(`删除组「${group.name}」？`)) return
    workingCustomGroups.splice(gi, 1)
    renderCustomEditor()
  }
  head.appendChild(delGroup)
  card.appendChild(head)

  const body = document.createElement('div')
  body.className = 'cgroup-body'
  if (!group.rules.length) {
    const empty = document.createElement('div')
    empty.className = 'empty-hint'
    empty.textContent = '此组下还没有规则'
    body.appendChild(empty)
  } else {
    group.rules.forEach((rule, ri) => body.appendChild(buildRuleCard(group, rule, ri)))
  }
  card.appendChild(body)
  return card
}

function buildRuleCard (group, rule, ri) {
  const card = document.createElement('div')
  card.className = 'crule'

  const head = document.createElement('div')
  head.className = 'crule-head'
  head.appendChild(makeInput('name-input', rule.name, '规则名', (v) => { rule.name = v }))
  head.appendChild(makeInput('id-input', rule.id, '规则 id', (v) => { rule.id = v }))
  const del = document.createElement('button')
  del.className = 'subtle danger'
  del.textContent = '×'
  del.title = '删除规则'
  del.onclick = () => {
    group.rules.splice(ri, 1)
    renderCustomEditor()
  }
  head.appendChild(del)
  card.appendChild(head)

  // Patterns
  const patternsField = document.createElement('div')
  patternsField.className = 'field'
  const patLabel = document.createElement('label')
  patLabel.textContent = '匹配正则'
  patLabel.title = '一行一个，匹配任一即生效'
  patternsField.appendChild(patLabel)
  const patArea = document.createElement('textarea')
  patArea.value = (rule.patterns || []).join('\n')
  patArea.placeholder = '^https://example\\.com/([^/]+)/?$'
  patArea.addEventListener('input', () => {
    rule.patterns = patArea.value.split('\n').map(s => s.trim()).filter(Boolean)
  })
  patternsField.appendChild(patArea)
  card.appendChild(patternsField)

  // Links
  const linksField = document.createElement('div')
  linksField.className = 'field'
  const linksLabel = document.createElement('label')
  linksLabel.textContent = '跳转链接'
  linksField.appendChild(linksLabel)
  const linksWrap = document.createElement('div')
  linksWrap.style.flex = '1'
  rule.links.forEach((link, li) => linksWrap.appendChild(buildLinkRow(rule, link, li)))
  const addLink = document.createElement('button')
  addLink.textContent = '+ 链接'
  addLink.style.marginTop = '4px'
  addLink.onclick = () => {
    rule.links.push({ id: 'link-' + (rule.links.length + 1), label: '', icon: '↗', url: '', desc: '' })
    renderCustomEditor()
  }
  linksWrap.appendChild(addLink)
  linksField.appendChild(linksWrap)
  card.appendChild(linksField)

  return card
}

function buildLinkRow (rule, link, li) {
  const row = document.createElement('div')
  row.className = 'clink'
  row.appendChild(makeInput('icon-input', link.icon || '', '🌐', (v) => { link.icon = v }))
  row.appendChild(makeInput('', link.label, '显示名', (v) => { link.label = v }))
  row.appendChild(makeInput('url-input', link.url, 'https://.../{1}', (v) => { link.url = v }))
  row.appendChild(makeInput('', link.desc || '', '说明（可选）', (v) => { link.desc = v }))
  const del = document.createElement('button')
  del.className = 'subtle danger'
  del.textContent = '×'
  del.title = '删除链接'
  del.onclick = () => {
    rule.links.splice(li, 1)
    renderCustomEditor()
  }
  row.appendChild(del)
  return row
}

function makeInput (cls, value, placeholder, onChange) {
  const inp = document.createElement('input')
  inp.type = 'text'
  if (cls) inp.className = cls
  inp.value = value || ''
  inp.placeholder = placeholder || ''
  inp.addEventListener('input', () => onChange(inp.value))
  return inp
}

// ─── Import / Export ───────────────────────────────────────────────────────

async function exportConfig () {
  const state = await getState()
  const payload = {
    type: 'url-switcher-config',
    version: 1,
    exportedAt: new Date().toISOString(),
    remoteUrl: state.remoteUrl || '',
    customGroups: state.customGroups || [],
    disabled: state.disabled || {}
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `url-switcher-config-${stamp()}.json`
  a.click()
  URL.revokeObjectURL(url)
  setStatus('io-status', '已导出', 'ok')
}

async function importConfig (e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (data.type !== 'url-switcher-config' || !Array.isArray(data.customGroups)) {
      throw new Error('文件格式不符（type 应为 url-switcher-config）')
    }
    if (!isValidRuleSet({ groups: data.customGroups })) {
      throw new Error('customGroups 内部结构不合法')
    }
    const mode = await chooseImportMode()
    if (!mode) return
    const state = await getState()
    let nextCustom = data.customGroups
    let nextDisabled = data.disabled || {}
    if (mode === 'merge') {
      const byId = new Map()
      for (const g of state.customGroups || []) byId.set(g.id, g)
      for (const g of data.customGroups) byId.set(g.id, g)
      nextCustom = [...byId.values()]
      nextDisabled = { ...(state.disabled || {}), ...(data.disabled || {}) }
    }
    const patch = {
      [STORAGE_KEYS.customGroups]: nextCustom,
      [STORAGE_KEYS.disabled]: nextDisabled
    }
    if (data.remoteUrl) patch[STORAGE_KEYS.remoteUrl] = data.remoteUrl
    await setState(patch)
    workingCustomGroups = deepClone(nextCustom)
    renderCustomEditor()
    renderRuleTree()
    if (data.remoteUrl) $('remote-url').value = data.remoteUrl
    renderRemoteStatus(await getState())
    setStatus('io-status', `已${mode === 'merge' ? '合并' : '覆盖'}导入（${data.customGroups.length} 个组）`, 'ok')
  } catch (err) {
    setStatus('io-status', '导入失败：' + (err.message || err), 'error')
  }
}

function chooseImportMode () {
  return new Promise((resolve) => {
    const choice = prompt('导入方式：输入 "merge" 合并到现有规则，输入 "replace" 完全覆盖。\n默认 merge。', 'merge')
    if (choice === null) return resolve(null)
    const v = choice.trim().toLowerCase()
    resolve(v === 'replace' ? 'replace' : 'merge')
  })
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function setStatus (id, text, kind) {
  const el = $(id)
  el.textContent = text
  el.className = 'meta' + (kind ? ' ' + kind : '')
}

function deepClone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function stamp () {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

init()
