// Shared rule engine: storage access, merging, matching, link expansion.

import { DEFAULT_RULES } from './default-rules.js'

const STORAGE_KEYS = {
  remoteUrl: 'remoteUrl',
  remoteRules: 'remoteRules',
  remoteUpdatedAt: 'remoteUpdatedAt',
  remoteError: 'remoteError',
  customGroups: 'customGroups',
  disabled: 'disabled',
  extIcons: 'extIcons',
  iconCache: 'iconCache',
  telemetryEnabled: 'telemetryEnabled'
}

export async function getState () {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.remoteUrl,
    STORAGE_KEYS.remoteRules,
    STORAGE_KEYS.remoteUpdatedAt,
    STORAGE_KEYS.remoteError,
    STORAGE_KEYS.customGroups,
    STORAGE_KEYS.disabled,
    STORAGE_KEYS.extIcons,
    STORAGE_KEYS.iconCache,
    STORAGE_KEYS.telemetryEnabled
  ])
  return {
    remoteUrl: data.remoteUrl || '',
    remoteRules: data.remoteRules || null,
    remoteUpdatedAt: data.remoteUpdatedAt || 0,
    remoteError: data.remoteError || '',
    customGroups: data.customGroups || [],
    disabled: data.disabled || {},
    extIcons: !!data.extIcons,
    iconCache: data.iconCache || {},
    telemetryEnabled: data.telemetryEnabled !== false
  }
}

export async function setState (patch) {
  await chrome.storage.local.set(patch)
}

// Merge default + remote (remote groups by id replace defaults) + custom overlays.
export function mergeRules (state) {
  const remote = isValidRuleSet(state.remoteRules) ? state.remoteRules : null
  const remoteById = new Map()
  if (remote) {
    for (const g of remote.groups) remoteById.set(g.id, g)
  }
  const merged = []
  for (const g of DEFAULT_RULES.groups) {
    merged.push(deepClone(remoteById.has(g.id) ? remoteById.get(g.id) : g))
    remoteById.delete(g.id)
  }
  // Remote-only groups (not present in defaults) come next.
  if (remote) {
    for (const g of remote.groups) {
      if (remoteById.has(g.id)) merged.push(deepClone(g))
    }
  }
  // Custom groups can target an existing group id. In that case custom rules are
  // merged into the group; same rule id overrides the default/remote rule unless
  // the rule is byte-for-byte equivalent after canonicalization.
  const mergedById = new Map(merged.map((g, i) => [g.id, i]))
  for (const customGroup of state.customGroups || []) {
    if (!customGroup || typeof customGroup.id !== 'string') continue
    const existingIndex = mergedById.get(customGroup.id)
    if (existingIndex == null) {
      mergedById.set(customGroup.id, merged.length)
      merged.push(deepClone(customGroup))
      continue
    }
    mergeCustomGroupIntoBase(merged[existingIndex], customGroup)
  }
  return { version: 1, groups: merged }
}

function mergeCustomGroupIntoBase (baseGroup, customGroup) {
  if (typeof customGroup.name === 'string' && customGroup.name) {
    baseGroup.name = customGroup.name
  }
  if (!Array.isArray(customGroup.rules)) return
  const ruleIndexById = new Map(baseGroup.rules.map((rule, index) => [rule.id, index]))
  const baseRuleByFingerprint = new Map(baseGroup.rules.map(rule => [canonicalRule(rule), rule]))

  for (const customRule of customGroup.rules) {
    if (!customRule || typeof customRule.id !== 'string') continue
    if (baseRuleByFingerprint.has(canonicalRule(customRule))) continue

    const existingIndex = ruleIndexById.get(customRule.id)
    if (existingIndex == null) {
      ruleIndexById.set(customRule.id, baseGroup.rules.length)
      baseGroup.rules.push(deepClone(customRule))
    } else {
      baseGroup.rules[existingIndex] = deepClone(customRule)
    }
  }
}

export function rulesAreEqual (left, right) {
  return canonicalRule(left) === canonicalRule(right)
}

function canonicalRule (rule) {
  return stableStringify(rule || null)
}

function stableStringify (value) {
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']'
  }
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => {
      return JSON.stringify(key) + ':' + stableStringify(value[key])
    }).join(',') + '}'
  }
  return JSON.stringify(value)
}

function deepClone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function isValidRuleSet (obj) {
  if (!obj || typeof obj !== 'object') return false
  if (!Array.isArray(obj.groups)) return false
  for (const g of obj.groups) {
    if (!g || typeof g.id !== 'string' || typeof g.name !== 'string') return false
    if (!Array.isArray(g.rules)) return false
    for (const r of g.rules) {
      if (!r || typeof r.id !== 'string') return false
      if (!Array.isArray(r.patterns) || !Array.isArray(r.links)) return false
      for (const p of r.patterns) if (typeof p !== 'string') return false
      for (const l of r.links) {
        if (!l || typeof l.url !== 'string' || typeof l.label !== 'string') return false
      }
    }
  }
  return true
}

// Returns array of { groupId, ruleId, link: {id,label,icon,url,desc} } for the URL.
export function findLinks (url, ruleSet, disabled = {}) {
  const out = []
  for (const group of ruleSet.groups) {
    if (disabled[group.id]) continue
    for (const rule of group.rules) {
      const ruleKey = `${group.id}/${rule.id}`
      if (disabled[ruleKey]) continue
      const captures = matchRule(url, rule)
      if (!captures) continue
      for (let i = 0; i < rule.links.length; i++) {
        const link = rule.links[i]
        const linkId = link.id || String(i)
        const linkKey = `${ruleKey}/${linkId}`
        if (disabled[linkKey]) continue
        const expanded = expandTemplate(link.url, captures)
        if (!expanded) continue
        out.push({
          groupId: group.id,
          ruleId: rule.id,
          link: { ...link, id: linkId, url: expanded }
        })
      }
      // Stop at first matching rule per group? Original behavior matched first rule across all rules.
      // We allow multiple matching rules so user can opt in to more, but typically only one rule matches.
    }
  }
  return out
}

function matchRule (url, rule) {
  for (const pattern of rule.patterns) {
    let re
    try { re = new RegExp(pattern) } catch { continue }
    const m = url.match(re)
    if (m) return m
  }
  return null
}

function expandTemplate (tpl, captures) {
  let result = tpl
  let ok = true
  result = result.replace(/\{(\d+)\}/g, (_, n) => {
    const v = captures[Number(n)]
    if (v === undefined) { ok = false; return '' }
    return v
  })
  return ok ? result : null
}

// Fetch remote rules JSON, validate, persist on success.
export async function fetchRemoteRules (url) {
  if (!url) throw new Error('未配置远程规则地址')
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!isValidRuleSet(json)) throw new Error('远程规则格式不合法')
  await setState({
    [STORAGE_KEYS.remoteRules]: json,
    [STORAGE_KEYS.remoteUpdatedAt]: Date.now(),
    [STORAGE_KEYS.remoteError]: ''
  })
  return json
}

export { STORAGE_KEYS }
