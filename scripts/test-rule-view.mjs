import assert from 'node:assert/strict'

import { filterRuleGroups } from '../rule-view.js'

const ruleSet = {
  version: 1,
  groups: [
    {
      id: 'github',
      name: 'GitHub',
      rules: [
        {
          id: 'repo',
          name: 'Repository',
          patterns: ['^https://github\\.com/([^/]+)/([^/]+)'],
          links: [
            { id: 'raw', label: 'Raw', icon: 'lucide:file-text', url: 'https://raw.githubusercontent.com/{1}/{2}', desc: 'Raw files' }
          ]
        },
        {
          id: 'pr',
          name: 'Pull Request',
          patterns: ['^https://github\\.com/([^/]+)/([^/]+)/pull/(\\d+)'],
          links: [
            { id: 'diff', label: 'Diff', icon: 'lucide:code', url: 'https://github.com/{1}/{2}/pull/{3}.diff', desc: 'Patch diff' }
          ]
        }
      ]
    },
    {
      id: 'android',
      name: 'Android',
      rules: [
        {
          id: 'google-play-apk',
          name: 'GooglePlayApk',
          patterns: ['^https://play\\.google\\.com/store/apps/details\\?id=([^&#]+).*'],
          links: [
            { id: 'apkpure', label: 'ApkPure', icon: 'lucide:package', url: 'https://apkpure.com/cn/store/apps/details?id={1}', desc: 'download in apk pure' }
          ]
        }
      ]
    },
    {
      id: 'custom-tools',
      name: 'Custom Tools',
      rules: [
        {
          id: 'tool',
          name: 'Tool Detail',
          patterns: ['^https://tools\\.example\\.com/(.+)'],
          links: [
            { id: 'admin', label: 'Admin', icon: 'lucide:wrench', url: 'https://admin.example.com/{1}', desc: 'Open admin' }
          ]
        }
      ]
    }
  ]
}

const sources = {
  groups: {
    github: 'base',
    android: 'modified',
    'custom-tools': 'custom'
  },
  rules: {
    'github/repo': 'base',
    'github/pr': 'modified',
    'android/google-play-apk': 'custom',
    'custom-tools/tool': 'custom'
  }
}

{
  const result = filterRuleGroups(ruleSet, {
    search: 'apkpure',
    statusFilter: 'all',
    disabled: {},
    sources
  })
  assert.deepEqual(result.groups.map(group => group.id), ['android'])
  assert.deepEqual(result.groups[0].rules.map(rule => rule.id), ['google-play-apk'])
  assert.deepEqual([...result.autoOpenGroupIds], ['android'])
  assert.equal(result.hasActiveFilters, true)
}

{
  const result = filterRuleGroups(ruleSet, {
    search: 'github',
    statusFilter: 'all',
    disabled: {},
    sources
  })
  assert.deepEqual(result.groups.map(group => group.id), ['github'])
  assert.deepEqual(result.groups[0].rules.map(rule => rule.id), ['repo', 'pr'])
  assert.deepEqual([...result.autoOpenGroupIds], ['github'])
}

{
  const result = filterRuleGroups(ruleSet, {
    search: '',
    statusFilter: 'modified',
    disabled: {},
    sources
  })
  assert.deepEqual(result.groups.map(group => group.id), ['github', 'android'])
  assert.deepEqual(result.groups[0].rules.map(rule => rule.id), ['pr'])
  assert.deepEqual(result.groups[1].rules.map(rule => rule.id), ['google-play-apk'])
}

{
  const result = filterRuleGroups(ruleSet, {
    search: '',
    statusFilter: 'disabled',
    disabled: {
      'github/pr/diff': true,
      android: true
    },
    sources
  })
  assert.deepEqual(result.groups.map(group => group.id), ['github', 'android'])
  assert.deepEqual(result.groups[0].rules.map(rule => rule.id), ['pr'])
  assert.deepEqual(result.groups[1].rules.map(rule => rule.id), ['google-play-apk'])
}

console.log('rule-view tests passed')
