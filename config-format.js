export const CONFIG_TYPE = 'fork-url-config'
const LEGACY_CONFIG_TYPE = 'url-switcher-config'

export function isSupportedConfigType (type) {
  return type === CONFIG_TYPE || type === LEGACY_CONFIG_TYPE
}

export function buildAllConfigPayload ({ exportedAt = new Date().toISOString(), remoteUrl = '', customGroups = [], disabled = {} } = {}) {
  return {
    type: CONFIG_TYPE,
    version: 1,
    exportScope: 'all',
    exportedAt,
    remoteUrl,
    customGroups: deepClone(customGroups),
    disabled: deepClone(disabled)
  }
}

export function buildGroupConfigPayload ({ exportedAt = new Date().toISOString(), group, disabled = {} } = {}) {
  if (!group || typeof group.id !== 'string' || typeof group.name !== 'string') {
    throw new Error('导出组信息不完整')
  }
  return {
    type: CONFIG_TYPE,
    version: 1,
    exportScope: 'group',
    exportedAt,
    exportedGroup: {
      id: group.id,
      name: group.name
    },
    customGroups: [deepClone(group)],
    disabled: pickDisabledForGroup(disabled, group.id)
  }
}

export function configFileNameForAll (stamp) {
  return `fork-url-config-${stamp}.json`
}

export function configFileNameForGroup (groupId) {
  return `fork-url-config-${safeFilePart(groupId || 'group')}.json`
}

function pickDisabledForGroup (disabled, groupId) {
  const out = {}
  for (const [key, value] of Object.entries(disabled || {})) {
    if (key === groupId || key.startsWith(`${groupId}/`)) out[key] = value
  }
  return out
}

function safeFilePart (value) {
  return String(value).trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'group'
}

function deepClone (obj) {
  return JSON.parse(JSON.stringify(obj))
}
