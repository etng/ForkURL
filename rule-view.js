// Pure helpers for browsing and filtering the options rule tree.

const VALID_STATUS_FILTERS = new Set(['all', 'custom', 'modified', 'disabled'])

export function filterRuleGroups (ruleSet, options = {}) {
  const search = normalizeSearch(options.search || '')
  const statusFilter = VALID_STATUS_FILTERS.has(options.statusFilter) ? options.statusFilter : 'all'
  const disabled = options.disabled || {}
  const sources = options.sources || {}
  const hasSearch = search.length > 0
  const hasStatusFilter = statusFilter !== 'all'
  const hasActiveFilters = hasSearch || hasStatusFilter
  const groups = []
  const autoOpenGroupIds = new Set()

  for (const group of ruleSet.groups || []) {
    const groupSource = sourceKind(sources.groups && sources.groups[group.id])
    const groupSearchMatch = hasSearch && matchesGroupSearch(group, search)
    const groupStatusMatch = hasStatusFilter && groupMatchesStatus(group, groupSource, statusFilter, disabled)
    const matchedRules = []

    for (const rule of group.rules || []) {
      const ruleSource = sourceKind(sources.rules && sources.rules[ruleKey(group.id, rule.id)])
      const searchMatches = !hasSearch || groupSearchMatch || matchesRuleSearch(rule, search)
      const statusMatches = !hasStatusFilter || ruleMatchesStatus(group, rule, ruleSource, statusFilter, disabled)
      if (searchMatches && statusMatches) matchedRules.push(rule)
    }

    let visibleRules = matchedRules
    if (!hasActiveFilters) {
      visibleRules = group.rules || []
    } else if (groupSearchMatch && !hasStatusFilter) {
      visibleRules = group.rules || []
    } else if (!hasSearch && groupStatusMatch) {
      visibleRules = group.rules || []
    } else if (groupSearchMatch && groupStatusMatch) {
      visibleRules = group.rules || []
    }

    if (visibleRules.length || groupSearchMatch || groupStatusMatch) {
      groups.push({ ...group, rules: visibleRules })
      if (hasActiveFilters) autoOpenGroupIds.add(group.id)
    }
  }

  return { groups, autoOpenGroupIds, hasActiveFilters }
}

function normalizeSearch (value) {
  return String(value).trim().toLowerCase()
}

function sourceKind (kind) {
  return kind || 'base'
}

function groupMatchesStatus (group, source, statusFilter, disabled) {
  if (statusFilter === 'custom') return source === 'custom'
  if (statusFilter === 'modified') return source === 'modified'
  if (statusFilter === 'disabled') return !!disabled[group.id]
  return true
}

function ruleMatchesStatus (group, rule, source, statusFilter, disabled) {
  if (statusFilter === 'custom') return source === 'custom'
  if (statusFilter === 'modified') return source === 'modified'
  if (statusFilter === 'disabled') return isRuleDisabled(group, rule, disabled)
  return true
}

function isRuleDisabled (group, rule, disabled) {
  const key = ruleKey(group.id, rule.id)
  if (disabled[group.id] || disabled[key]) return true
  for (let index = 0; index < (rule.links || []).length; index++) {
    const link = rule.links[index]
    if (disabled[`${key}/${link.id || String(index)}`]) return true
  }
  return false
}

function matchesGroupSearch (group, search) {
  return valuesMatchSearch([group.id, group.name], search)
}

function matchesRuleSearch (rule, search) {
  const values = [rule.id, rule.name, ...(rule.patterns || [])]
  for (const link of rule.links || []) {
    values.push(link.id, link.label, link.icon, link.url, link.desc)
  }
  return valuesMatchSearch(values, search)
}

function valuesMatchSearch (values, search) {
  return values.some(value => String(value || '').toLowerCase().includes(search))
}

function ruleKey (groupId, ruleId) {
  return `${groupId}/${ruleId}`
}
