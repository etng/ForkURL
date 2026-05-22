import { getState, setState, mergeRules, isValidRuleSet, rulesAreEqual, STORAGE_KEYS } from './rules-engine.js'
import { iconHTML, loadIconCache, clearIconCache, getIconCache } from './icon-render.js'
import { openIconPicker, configureExtIcons } from './icon-picker.js'
import { filterRuleGroups } from './rule-view.js'
import {
  buildAllConfigPayload,
  buildGroupConfigPayload,
  configFileNameForAll,
  configFileNameForGroup,
  isSupportedConfigType
} from './config-format.js'

const $ = (id) => document.getElementById(id)

const DEFAULT_REMOTE_URL = 'https://raw.githubusercontent.com/etng/ForkURL/main/rules.json'

let workingCustomGroups = [] // editable copy until "Save"
let baseRuleSet = { version: 1, groups: [] }
let expandedGroupIds = new Set()
let suppressFilterAutoOpen = false

async function init () {
  await loadIconCache()
  const state = await getState()
  baseRuleSet = getBaseRuleSet(state)

  chrome.runtime.sendMessage({ type: 'track-telemetry', eventName: 'options_open' })

  // Extended icons toggle
  configureExtIcons(state.extIcons)
  $('ext-icons-toggle').checked = !!state.extIcons
  $('ext-icons-toggle').addEventListener('change', async (e) => {
    await setState({ [STORAGE_KEYS.extIcons]: e.target.checked })
    configureExtIcons(e.target.checked)
  })
  updateIconCacheMeta()
  $('clear-icon-cache').addEventListener('click', async () => {
    if (!confirm('清空所有已缓存的在线图标？这不会影响内置图标。')) return
    await clearIconCache()
    updateIconCacheMeta()
    renderRuleTree()
  })

  $('telemetry-toggle').checked = state.telemetryEnabled
  renderTelemetryStatus(state.telemetryEnabled)
  $('telemetry-toggle').addEventListener('change', async (e) => {
    const enabled = e.target.checked
    await setState({ [STORAGE_KEYS.telemetryEnabled]: enabled })
    renderTelemetryStatus(enabled)
  })

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
      baseRuleSet = getBaseRuleSet(s)
      renderRemoteStatus(s)
      if (res && !res.ok) {
        $('remote-status').textContent = '同步失败：' + res.error
        $('remote-status').className = 'meta error'
      }
      refreshCustomGroupPicker()
      renderRuleTree()
    })
  })
  $('clear-remote-cache').addEventListener('click', clearRemoteCache)
  $('disconnect-remote-source').addEventListener('click', disconnectRemoteSource)

  workingCustomGroups = deepClone(state.customGroups || [])
  refreshCustomGroupPicker()

  $('rule-search').addEventListener('input', () => {
    suppressFilterAutoOpen = false
    renderRuleTree()
  })
  $('rule-status-filter').addEventListener('change', () => {
    suppressFilterAutoOpen = false
    renderRuleTree()
  })
  $('expand-all-rules').addEventListener('click', async () => {
    const { groups } = await getCurrentRuleView()
    expandedGroupIds = new Set(groups.map(group => group.id))
    suppressFilterAutoOpen = false
    renderRuleTree()
  })
  $('collapse-all-rules').addEventListener('click', () => {
    expandedGroupIds.clear()
    suppressFilterAutoOpen = true
    renderRuleTree()
  })

  $('add-group').addEventListener('click', () => {
    const group = {
      id: 'group-' + Math.random().toString(36).slice(2, 7),
      name: '新规则组',
      rules: []
    }
    workingCustomGroups.push(group)
    expandedGroupIds.add(group.id)
    refreshCustomGroupPicker()
    renderRuleTree()
  })

  $('save-custom').addEventListener('click', async () => {
    const nextCustomGroups = normalizeCustomGroupsForSave(workingCustomGroups)
    const wrapper = { groups: nextCustomGroups }
    if (!isValidRuleSet(wrapper)) {
      setStatus('custom-status', '校验失败：请检查每个规则至少有 1 个 pattern 与 1 个 link，且 url/label 都填写', 'error')
      return
    }
    await setState({ [STORAGE_KEYS.customGroups]: nextCustomGroups })
    workingCustomGroups = deepClone(nextCustomGroups)
    refreshCustomGroupPicker()
    setStatus('custom-status', `已保存（${workingCustomGroups.length} 个自定义组）`, 'ok')
    renderRuleTree()
  })

  $('reset-custom').addEventListener('click', async () => {
    const s = await getState()
    baseRuleSet = getBaseRuleSet(s)
    workingCustomGroups = deepClone(s.customGroups || [])
    refreshCustomGroupPicker()
    renderRuleTree()
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

function renderTelemetryStatus (enabled) {
  const el = $('telemetry-status')
  el.textContent = enabled
    ? '已开启；每日限频发送。'
    : '已关闭；本地遥测状态会被清理。'
  el.className = 'meta' + (enabled ? '' : ' ok')
}

async function clearRemoteCache () {
  if (!confirm('清空远程规则缓存？本地自定义规则会保留，下次点击“立即更新”会重新同步远程源。')) return
  await chrome.storage.local.remove([
    STORAGE_KEYS.remoteRules,
    STORAGE_KEYS.remoteUpdatedAt,
    STORAGE_KEYS.remoteError
  ])
  const state = await getState()
  baseRuleSet = getBaseRuleSet(state)
  renderRemoteStatus(state)
  refreshCustomGroupPicker()
  renderRuleTree()
}

async function disconnectRemoteSource () {
  if (!confirm('清空远程源地址和远程规则缓存？本地自定义规则会保留。')) return
  await chrome.storage.local.remove([
    STORAGE_KEYS.remoteUrl,
    STORAGE_KEYS.remoteRules,
    STORAGE_KEYS.remoteUpdatedAt,
    STORAGE_KEYS.remoteError
  ])
  $('remote-url').value = ''
  const state = await getState()
  baseRuleSet = getBaseRuleSet(state)
  renderRemoteStatus(state)
  refreshCustomGroupPicker()
  renderRuleTree()
}

// ─── Rule tree (enable/disable) ────────────────────────────────────────────

async function renderRuleTree () {
  const { state, groups, autoOpenGroupIds, hasActiveFilters, totalGroups, totalRules } = await getCurrentRuleView()
  const tree = $('rule-tree')
  tree.innerHTML = ''
  renderRuleBrowserStatus(groups, hasActiveFilters, totalGroups, totalRules)
  if (!groups.length) {
    const empty = document.createElement('div')
    empty.className = 'empty-hint'
    empty.textContent = '没有匹配的规则'
    tree.appendChild(empty)
    return
  }
  for (const group of groups) {
    const shouldOpen = expandedGroupIds.has(group.id) ||
      (hasActiveFilters && !suppressFilterAutoOpen && autoOpenGroupIds.has(group.id))
    tree.appendChild(renderGroup(group, state, { open: shouldOpen }))
  }
}

async function getCurrentRuleView () {
  const state = await getState()
  const ruleSet = mergeRules({ ...state, customGroups: workingCustomGroups })
  const sources = getRuleSourceIndex(ruleSet)
  const view = filterRuleGroups(ruleSet, {
    search: $('rule-search') ? $('rule-search').value : '',
    statusFilter: $('rule-status-filter') ? $('rule-status-filter').value : 'all',
    disabled: state.disabled || {},
    sources
  })
  return {
    state,
    ...view,
    totalGroups: ruleSet.groups.length,
    totalRules: ruleSet.groups.reduce((sum, group) => sum + (group.rules || []).length, 0)
  }
}

function renderRuleBrowserStatus (groups, hasActiveFilters, totalGroups, totalRules) {
  const el = $('rule-browser-status')
  const visibleRules = groups.reduce((sum, group) => sum + (group.rules || []).length, 0)
  el.textContent = hasActiveFilters
    ? `显示 ${groups.length}/${totalGroups} 个组、${visibleRules}/${totalRules} 条规则`
    : `共 ${totalGroups} 个组、${totalRules} 条规则`
}

function getRuleSourceIndex (ruleSet) {
  const groups = {}
  const rules = {}
  for (const group of ruleSet.groups || []) {
    groups[group.id] = getGroupSource(group.id).kind
    for (const rule of group.rules || []) {
      rules[`${group.id}/${rule.id}`] = getRuleSource(group.id, rule).kind
    }
  }
  return { groups, rules }
}

function renderGroup (group, state, options = {}) {
  const baseGroup = findBaseGroup(group.id)
  const workingGroup = findWorkingGroup(group.id)
  const rules = group.rules || []
  const det = document.createElement('details')
  det.className = 'group'
  det.open = !!options.open
  det.addEventListener('toggle', () => {
    if (det.open) expandedGroupIds.add(group.id)
    else expandedGroupIds.delete(group.id)
  })

  const sum = document.createElement('summary')
  const cb = makeCheckbox(!state.disabled[group.id], async (checked) => {
    await toggleDisabled(group.id, !checked)
  })
  cb.addEventListener('click', (e) => e.stopPropagation())
  sum.appendChild(cb)
  const title = document.createElement('span')
  title.className = 'group-summary-main'
  const name = document.createElement('span')
  name.className = 'group-summary-name'
  name.textContent = (workingGroup ? workingGroup.name : group.name) + ' '
  title.appendChild(name)
  const tag = document.createElement('span')
  tag.className = 'rule-pat group-summary-id'
  tag.textContent = `(${workingGroup ? workingGroup.id : group.id})`
  title.appendChild(tag)
  sum.appendChild(title)
  const source = getGroupSource(group.id)
  sum.appendChild(makeSourceBadge(source))
  const badge = document.createElement('span')
  badge.className = 'badge'
  badge.style.flexShrink = '0'
  badge.textContent = `${rules.length} 规则`
  sum.appendChild(badge)
  det.appendChild(sum)

  const body = document.createElement('div')
  body.className = 'group-body'
  body.appendChild(buildGroupTools(group, baseGroup, workingGroup, name, tag))
  if (!rules.length) {
    const empty = document.createElement('div')
    empty.className = 'empty-hint'
    empty.textContent = '此组下还没有规则'
    body.appendChild(empty)
  }
  for (const rule of rules) {
    body.appendChild(renderRuleRow(workingGroup || group, rule, state))
  }
  det.appendChild(body)
  return det
}

function buildGroupTools (group, baseGroup, workingGroup, titleName, titleTag) {
  const tools = document.createElement('div')
  tools.className = 'group-tools'

  if (workingGroup) {
    const editor = document.createElement('span')
    editor.className = 'group-title-editor'
    editor.appendChild(makeInput('name-input', workingGroup.name, '组名称', (v) => {
      workingGroup.name = v
      titleName.textContent = v + ' '
    }))
    const idInput = makeInput('id-input', workingGroup.id, '唯一 id', (v) => {
      workingGroup.id = v
      titleTag.textContent = `(${v})`
    })
    if (baseGroup) {
      idInput.disabled = true
      idInput.title = '已有组 id 用来合并内置或远程规则，不能在覆盖层修改'
    }
    editor.appendChild(idInput)
    tools.appendChild(editor)
  }

  const addRule = document.createElement('button')
  addRule.className = 'subtle'
  addRule.textContent = '+ 规则'
  addRule.title = '在此组下添加自定义规则'
  addRule.addEventListener('click', () => {
    addCustomRuleToGroup(workingGroup ? workingGroup.id : group.id)
  })
  tools.appendChild(addRule)

  if (workingGroup && (workingGroup.rules || []).length) {
    const exportCustom = document.createElement('button')
    exportCustom.className = 'subtle'
    exportCustom.textContent = '导出'
    exportCustom.title = '只导出此组的自定义规则和覆盖'
    exportCustom.addEventListener('click', () => exportGroupCustomConfig(workingGroup.id))
    tools.appendChild(exportCustom)
  }

  if (workingGroup) {
    const removeCustom = document.createElement('button')
    removeCustom.className = 'subtle danger'
    removeCustom.textContent = baseGroup ? '清空自定义' : '删除组'
    removeCustom.title = baseGroup ? '删除此组下的自定义规则和覆盖' : '删除这个自定义组'
    removeCustom.addEventListener('click', () => {
      const message = baseGroup
        ? `清空「${baseGroup.name}」下的所有自定义规则和覆盖？内置/远程规则不会删除。`
        : `删除组「${workingGroup.name}」？`
      if (!confirm(message)) return
      workingCustomGroups = workingCustomGroups.filter(item => item !== workingGroup)
      refreshCustomGroupPicker()
      renderRuleTree()
    })
    tools.appendChild(removeCustom)
  }

  return tools
}

function renderRuleRow (group, rule, state) {
  const ruleKey = `${group.id}/${rule.id}`
  const workingRule = findWorkingRule(group.id, rule.id)
  const displayRule = workingRule || rule
  const wrap = document.createElement('div')
  wrap.className = 'rule'

  const head = document.createElement('div')
  head.className = 'rule-head'
  const cb = makeCheckbox(!state.disabled[ruleKey], async (checked) => {
    await toggleDisabled(ruleKey, !checked)
  })
  head.appendChild(cb)
  const main = document.createElement('span')
  main.className = 'rule-main'
  const name = document.createElement('span')
  name.className = 'rule-name'
  name.textContent = displayRule.name || displayRule.id
  main.appendChild(name)
  const pat = document.createElement('span')
  pat.className = 'rule-pat'
  pat.textContent = (displayRule.patterns || []).join(' | ')
  main.appendChild(pat)
  head.appendChild(main)
  head.appendChild(makeSourceBadge(getRuleSource(group.id, displayRule)))
  if (!workingRule) {
    const edit = document.createElement('button')
    edit.className = 'subtle'
    edit.textContent = '编辑'
    edit.title = '复制到自定义规则中编辑；同 id 规则会覆盖内置或远程版本'
    edit.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      editRuleOverride(group, rule)
    })
    const actions = document.createElement('span')
    actions.className = 'rule-actions'
    actions.appendChild(edit)
    head.appendChild(actions)
  }
  wrap.appendChild(head)

  if (workingRule) {
    const workingGroup = ensureWorkingGroup(group.id, group.name)
    const ruleIndex = workingGroup.rules.indexOf(workingRule)
    wrap.appendChild(buildRuleCard(workingGroup, workingRule, ruleIndex))
  } else {
    const links = document.createElement('div')
    links.className = 'links'
    displayRule.links.forEach((link, idx) => {
      const linkId = link.id || String(idx)
      const linkKey = `${ruleKey}/${linkId}`
      const row = document.createElement('div')
      row.className = 'link-row'
      const lcb = makeCheckbox(!state.disabled[linkKey], async (checked) => {
        await toggleDisabled(linkKey, !checked)
      })
      row.appendChild(lcb)
      const ico = document.createElement('span')
      ico.className = 'preview-icon'
      ico.innerHTML = iconHTML(link.icon)
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
  }
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

// ─── Rule management editor ────────────────────────────────────────────────

function getBaseRuleSet (state) {
  return mergeRules({ ...state, customGroups: [] })
}

function getAvailableGroupsForEditor () {
  const groups = []
  const seen = new Set()
  for (const group of baseRuleSet.groups || []) {
    const workingGroup = findWorkingGroup(group.id)
    groups.push({ id: group.id, name: workingGroup ? workingGroup.name : group.name, baseGroup: group })
    seen.add(group.id)
  }
  for (const group of workingCustomGroups || []) {
    if (seen.has(group.id)) continue
    groups.push({ id: group.id, name: group.name, baseGroup: null })
    seen.add(group.id)
  }
  return groups
}

function refreshCustomGroupPicker () {
  // Kept as a narrow hook for callers that update editable group metadata.
}

function findBaseGroup (groupId) {
  return (baseRuleSet.groups || []).find(group => group.id === groupId) || null
}

function findWorkingGroup (groupId) {
  return workingCustomGroups.find(group => group.id === groupId) || null
}

function findBaseRule (groupId, ruleId) {
  const group = findBaseGroup(groupId)
  return group ? group.rules.find(rule => rule.id === ruleId) || null : null
}

function findWorkingRule (groupId, ruleId) {
  const group = findWorkingGroup(groupId)
  return group ? group.rules.find(rule => rule.id === ruleId) || null : null
}

function getGroupSource (groupId) {
  const baseGroup = findBaseGroup(groupId)
  const workingGroup = findWorkingGroup(groupId)
  if (!baseGroup) return { kind: 'custom', label: '用户自定义' }
  if (workingGroup && workingGroup.name !== baseGroup.name) return { kind: 'modified', label: '已改名' }
  if (workingGroup && (workingGroup.rules || []).length) return { kind: 'modified', label: '含自定义' }
  return { kind: 'base', label: '内置/远程' }
}

function getRuleSource (groupId, rule) {
  const baseRule = findBaseRule(groupId, rule.id)
  const workingRule = findWorkingRule(groupId, rule.id)
  if (!baseRule) return { kind: 'custom', label: '自定义' }
  if (workingRule && rulesAreEqual(baseRule, workingRule)) return { kind: 'draft', label: '编辑中' }
  if (workingRule) return { kind: 'modified', label: '已修改' }
  return { kind: 'base', label: '内置/远程' }
}

function makeSourceBadge ({ kind, label }) {
  const badge = document.createElement('span')
  badge.className = 'source-badge ' + kind
  badge.textContent = label
  return badge
}

function ensureWorkingGroup (groupId, fallbackName) {
  let group = findWorkingGroup(groupId)
  if (group) return group
  const baseGroup = findBaseGroup(groupId)
  group = {
    id: groupId,
    name: fallbackName || (baseGroup && baseGroup.name) || groupId,
    rules: []
  }
  workingCustomGroups.push(group)
  return group
}

function addCustomRuleToGroup (groupId) {
  if (!groupId) return
  const baseGroup = findBaseGroup(groupId)
  const group = ensureWorkingGroup(groupId, baseGroup && baseGroup.name)
  const rule = createBlankRule(groupId)
  group.rules.push(rule)
  expandedGroupIds.add(group.id)
  suppressFilterAutoOpen = false
  refreshCustomGroupPicker()
  renderRuleTree()
  setStatus('custom-status', '已添加规则，保存后生效', '')
  scrollRuleEditorIntoView(group.id, rule.id)
}

function editRuleOverride (group, rule) {
  const workingGroup = ensureWorkingGroup(group.id, group.name)
  const existing = workingGroup.rules.find(item => item.id === rule.id)
  if (!existing) {
    workingGroup.rules.push(deepClone(rule))
  }
  expandedGroupIds.add(workingGroup.id)
  suppressFilterAutoOpen = false
  refreshCustomGroupPicker()
  renderRuleTree()
  setStatus('custom-status', '已放入自定义规则，保存后会覆盖同 id 的内置或远程规则', '')
  scrollRuleEditorIntoView(group.id, rule.id)
}

function createBlankRule (groupId) {
  return {
    id: nextRuleId(groupId),
    name: '新规则',
    patterns: [''],
    links: [{ id: 'link-1', label: '', icon: '↗', url: '', desc: '' }]
  }
}

function nextRuleId (groupId) {
  const used = new Set()
  const baseGroup = findBaseGroup(groupId)
  for (const rule of (baseGroup && baseGroup.rules) || []) used.add(rule.id)
  const customGroup = workingCustomGroups.find(group => group.id === groupId)
  for (const rule of (customGroup && customGroup.rules) || []) used.add(rule.id)
  for (let i = 1; i < 1000; i++) {
    const id = `rule-${i}`
    if (!used.has(id)) return id
  }
  return 'rule-' + Math.random().toString(36).slice(2, 7)
}

function scrollRuleEditorIntoView (groupId, ruleId) {
  setTimeout(() => {
    const cards = document.querySelectorAll('.crule')
    const card = [...cards].find(item => item.dataset.groupId === groupId && item.dataset.ruleId === ruleId)
    if (!card) return
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    card.classList.add('focus-flash')
    const firstInput = card.querySelector('input')
    if (firstInput) firstInput.focus()
    setTimeout(() => card.classList.remove('focus-flash'), 1200)
  }, 0)
}

function moveRuleToGroup (sourceGroup, rule, targetGroupId) {
  if (!targetGroupId || sourceGroup.id === targetGroupId) return
  const targetBaseGroup = findBaseGroup(targetGroupId)
  const targetGroup = ensureWorkingGroup(targetGroupId, targetBaseGroup && targetBaseGroup.name)
  const sourceIndex = sourceGroup.rules.indexOf(rule)
  if (sourceIndex < 0) return

  sourceGroup.rules.splice(sourceIndex, 1)
  const conflict = targetGroup.rules.some(item => item.id === rule.id) || !!findBaseRule(targetGroup.id, rule.id)
  if (conflict) {
    rule.id = nextRuleId(targetGroup.id)
    setStatus('custom-status', `目标组已有同 id 规则，已自动改为 ${rule.id}`, '')
  } else {
    setStatus('custom-status', `已移动到「${targetGroup.name || targetGroup.id}」，保存后生效`, '')
  }
  targetGroup.rules.push(rule)
  expandedGroupIds.add(targetGroup.id)
  expandedGroupIds.delete(sourceGroup.id)
  suppressFilterAutoOpen = false
  cleanupEmptyWorkingGroups()
  refreshCustomGroupPicker()
  renderRuleTree()
  scrollRuleEditorIntoView(targetGroup.id, rule.id)
}

function cleanupEmptyWorkingGroups () {
  workingCustomGroups = workingCustomGroups.filter(group => {
    const baseGroup = findBaseGroup(group.id)
    if (!baseGroup) return true
    return (group.rules || []).length > 0 || group.name !== baseGroup.name
  })
}

function normalizeCustomGroupsForSave (groups) {
  const normalized = []
  for (const group of groups || []) {
    const baseGroup = findBaseGroup(group.id)
    const nextGroup = deepClone(group)
    if (baseGroup) {
      nextGroup.rules = (nextGroup.rules || []).filter(rule => {
        const baseRule = baseGroup.rules.find(item => item.id === rule.id)
        return !(baseRule && rulesAreEqual(baseRule, rule))
      })
      if (!nextGroup.rules.length && nextGroup.name === baseGroup.name) continue
    }
    normalized.push(nextGroup)
  }
  return normalized
}

function buildRuleCard (group, rule, ri) {
  const card = document.createElement('div')
  card.className = 'crule'
  card.dataset.groupId = group.id
  card.dataset.ruleId = rule.id

  const head = document.createElement('div')
  head.className = 'crule-head'
  head.appendChild(makeInput('name-input', rule.name, '规则名', (v) => { rule.name = v }))
  head.appendChild(makeInput('id-input', rule.id, '规则 id', (v) => { rule.id = v }))

  const groupSelect = document.createElement('select')
  groupSelect.title = '移动到其他分组'
  groupSelect.style.flex = '1'
  groupSelect.style.minWidth = '160px'
  for (const targetGroup of getAvailableGroupsForEditor()) {
    const option = document.createElement('option')
    option.value = targetGroup.id
    option.textContent = targetGroup.name || targetGroup.id
    groupSelect.appendChild(option)
  }
  groupSelect.value = group.id
  groupSelect.addEventListener('change', () => moveRuleToGroup(group, rule, groupSelect.value))
  head.appendChild(groupSelect)

  const validateBtn = document.createElement('button')
  validateBtn.className = 'subtle'
  validateBtn.textContent = '🔍 验证'
  validateBtn.title = '用一个示例 URL 测试此规则'
  validateBtn.onclick = () => toggleValidator(card, rule)
  head.appendChild(validateBtn)

  const submitBtn = document.createElement('button')
  submitBtn.className = 'subtle'
  submitBtn.textContent = '📤 提交'
  submitBtn.title = '在 GitHub 上提交此规则到官方源（会预填字段）'
  submitBtn.onclick = () => openSubmissionUrl(group, rule)
  head.appendChild(submitBtn)

  const del = document.createElement('button')
  del.className = 'subtle danger'
  del.textContent = '×'
  const baseRule = findBaseRule(group.id, rule.id)
  del.title = baseRule ? '删除自定义覆盖，恢复内置/远程规则' : '删除自定义规则'
  del.onclick = () => {
    group.rules.splice(ri, 1)
    renderRuleTree()
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
    renderRuleTree()
  }
  linksWrap.appendChild(addLink)
  linksField.appendChild(linksWrap)
  card.appendChild(linksField)

  return card
}

function buildLinkRow (rule, link, li) {
  const row = document.createElement('div')
  row.className = 'clink'

  const iconBtn = document.createElement('button')
  iconBtn.type = 'button'
  iconBtn.className = 'icon-btn'
  iconBtn.title = '点击选择图标'
  iconBtn.innerHTML = iconHTML(link.icon)
  iconBtn.addEventListener('click', () => {
    openIconPicker(link.icon, (value) => {
      link.icon = value
      iconBtn.innerHTML = iconHTML(value)
    })
  })
  row.appendChild(iconBtn)

  row.appendChild(makeInput('', link.label, '显示名', (v) => { link.label = v }))
  row.appendChild(makeInput('url-input', link.url, 'https://.../{1}', (v) => { link.url = v }))
  row.appendChild(makeInput('', link.desc || '', '说明（可选）', (v) => { link.desc = v }))
  const del = document.createElement('button')
  del.className = 'subtle danger'
  del.textContent = '×'
  del.title = '删除链接'
  del.onclick = () => {
    rule.links.splice(li, 1)
    renderRuleTree()
  }
  row.appendChild(del)
  return row
}

// ─── Validate / Submit helpers (custom-rule editor) ────────────────────────

function toggleValidator (card, rule) {
  const existing = card.querySelector('.rule-validator')
  if (existing) {
    existing.remove()
    return
  }
  const panel = document.createElement('div')
  panel.className = 'rule-validator'
  panel.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;margin-top:6px">
      <input type="url" class="vurl" placeholder="https://example.com/some/path 粘贴一个完整 URL 测试" style="flex:1">
      <button class="vrun primary">测试</button>
    </div>
    <div class="vresult" style="margin-top:6px;font-size:12px"></div>
  `
  card.appendChild(panel)
  const input = panel.querySelector('.vurl')
  const result = panel.querySelector('.vresult')
  const run = () => renderValidation(rule, input.value.trim(), result)
  panel.querySelector('.vrun').addEventListener('click', run)
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run() })
  setTimeout(() => input.focus(), 0)
}

function renderValidation (rule, url, resultEl) {
  resultEl.innerHTML = ''
  if (!url) {
    resultEl.innerHTML = '<span class="meta">请输入 URL</span>'
    return
  }

  // Compile patterns
  const compileErrors = []
  const regexes = []
  for (const p of rule.patterns || []) {
    try { regexes.push({ src: p, re: new RegExp(p) }) }
    catch (e) { compileErrors.push({ src: p, msg: e.message }) }
  }
  if (compileErrors.length) {
    const ul = document.createElement('ul')
    ul.style.cssText = 'margin:0;padding-left:18px;color:#cf222e'
    for (const e of compileErrors) {
      const li = document.createElement('li')
      li.innerHTML = `pattern 编译失败：<code>${escapeHtml(e.src)}</code> — ${escapeHtml(e.msg)}`
      ul.appendChild(li)
    }
    resultEl.appendChild(ul)
    return
  }

  // Find first match
  let captures = null, matchedPattern = null
  for (const { src, re } of regexes) {
    const m = url.match(re)
    if (m) { captures = m; matchedPattern = src; break }
  }
  if (!captures) {
    resultEl.innerHTML = `<span class="meta error">❌ URL 未匹配任何 pattern。</span>`
    return
  }

  // Show match summary
  const hdr = document.createElement('div')
  hdr.innerHTML = `<span class="meta ok">✅ 匹配 pattern：</span><code style="font-size:11px">${escapeHtml(matchedPattern)}</code>`
  resultEl.appendChild(hdr)

  if (captures.length > 1) {
    const caps = document.createElement('div')
    caps.style.cssText = 'font-size:11px;color:#57606a;margin-top:2px'
    caps.innerHTML = '捕获组：' + captures.slice(1).map((c, i) => `<code>{${i + 1}}</code> = <code>${escapeHtml(c)}</code>`).join(' · ')
    resultEl.appendChild(caps)
  }

  // Render generated URLs
  const list = document.createElement('div')
  list.style.cssText = 'margin-top:6px;display:flex;flex-direction:column;gap:3px'
  for (const link of rule.links || []) {
    const expanded = expandTemplate(link.url, captures)
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;gap:6px;align-items:center'
    if (expanded == null) {
      row.innerHTML = `<span class="meta error">⚠ ${escapeHtml(link.label)} 模板有未填充的占位符</span> <code style="font-size:11px">${escapeHtml(link.url)}</code>`
    } else {
      row.innerHTML = `<span class="preview-icon">${iconHTML(link.icon)}</span><strong style="font-size:12px">${escapeHtml(link.label)}</strong> → <a href="${escapeAttr(expanded)}" target="_blank" style="font-size:11px;font-family:ui-monospace,monospace">${escapeHtml(expanded)}</a>`
    }
    list.appendChild(row)
  }
  resultEl.appendChild(list)
}

function expandTemplate (tpl, captures) {
  let ok = true
  const out = String(tpl).replace(/\{(\d+)\}/g, (_, n) => {
    const v = captures[Number(n)]
    if (v === undefined) { ok = false; return '' }
    return v
  })
  return ok ? out : null
}

function openSubmissionUrl (group, rule) {
  const linksTable = (rule.links || []).map(l =>
    [l.label || '', l.icon || '', l.url || '', l.desc || ''].join(' | ').replace(/\s*\|\s*$/, '')
  ).join('\n')

  const params = new URLSearchParams()
  params.set('template', 'submit-rule.yml')
  params.set('title', `[规则] ${group.name || group.id} / ${rule.name || rule.id}`)
  params.set('group_id', group.id)
  if (group.name) params.set('group_name', group.name)
  params.set('rule_id', rule.id)
  params.set('rule_name', rule.name || '')
  params.set('patterns', (rule.patterns || []).join('\n'))
  params.set('links', linksTable)

  const url = `https://github.com/etng/ForkURL/issues/new?${params.toString()}`
  chrome.tabs ? chrome.tabs.create({ url }) : window.open(url, '_blank')
}

function escapeAttr (s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function escapeHtml (s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
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
  const payload = buildAllConfigPayload({
    remoteUrl: state.remoteUrl || '',
    customGroups: state.customGroups || [],
    disabled: state.disabled || {}
  })
  downloadConfig(payload, configFileNameForAll(stamp()))
  setStatus('io-status', '已导出', 'ok')
}

async function exportGroupCustomConfig (groupId) {
  const state = await getState()
  const group = findWorkingGroup(groupId)
  if (!group || !(group.rules || []).length) {
    setStatus('custom-status', '此组没有可导出的自定义规则', 'error')
    return
  }
  const payload = buildGroupConfigPayload({ group, disabled: state.disabled || {} })
  downloadConfig(payload, configFileNameForGroup(group.id))
  setStatus('custom-status', `已导出「${group.name || group.id}」的自定义规则`, 'ok')
}

function downloadConfig (payload, fileName) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

async function importConfig (e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!isSupportedConfigType(data.type) || !Array.isArray(data.customGroups)) {
      throw new Error('文件格式不符（type 应为 fork-url-config）')
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
      nextCustom = mergeImportedCustomGroups(state.customGroups || [], data.customGroups)
      nextDisabled = { ...(state.disabled || {}), ...(data.disabled || {}) }
    }
    const patch = {
      [STORAGE_KEYS.customGroups]: nextCustom,
      [STORAGE_KEYS.disabled]: nextDisabled
    }
    if (data.remoteUrl) patch[STORAGE_KEYS.remoteUrl] = data.remoteUrl
    await setState(patch)
    const updatedState = await getState()
    baseRuleSet = getBaseRuleSet(updatedState)
    workingCustomGroups = deepClone(nextCustom)
    refreshCustomGroupPicker()
    renderRuleTree()
    if (data.remoteUrl) $('remote-url').value = data.remoteUrl
    renderRemoteStatus(updatedState)
    setStatus('io-status', `已${mode === 'merge' ? '合并' : '覆盖'}导入（${data.customGroups.length} 个组）`, 'ok')
  } catch (err) {
    setStatus('io-status', '导入失败：' + (err.message || err), 'error')
  }
}

function mergeImportedCustomGroups (currentGroups, importedGroups) {
  const byId = new Map()
  for (const group of currentGroups || []) byId.set(group.id, deepClone(group))

  for (const importedGroup of importedGroups || []) {
    const currentGroup = byId.get(importedGroup.id)
    if (!currentGroup) {
      byId.set(importedGroup.id, deepClone(importedGroup))
      continue
    }

    const currentRules = currentGroup.rules || []
    const currentRuleById = new Map(currentRules.map(rule => [rule.id, rule]))
    for (const importedRule of importedGroup.rules || []) {
      const currentRule = currentRuleById.get(importedRule.id)
      if (!currentRule) {
        const cloned = deepClone(importedRule)
        currentRules.push(cloned)
        currentRuleById.set(cloned.id, cloned)
      }
    }
    currentGroup.rules = currentRules.filter((rule, index, rules) => {
      return rules.findIndex(item => item.id === rule.id && rulesAreEqual(item, rule)) === index
    })
  }

  return [...byId.values()]
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

function updateIconCacheMeta () {
  const cache = getIconCache()
  const n = Object.keys(cache).length
  const bytes = JSON.stringify(cache).length
  $('icon-cache-meta').textContent = n
    ? `已缓存 ${n} 个在线图标（约 ${(bytes/1024).toFixed(1)} KB）`
    : ''
}

function stamp () {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

init()
