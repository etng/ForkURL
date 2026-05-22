import assert from 'node:assert/strict'

import {
  CONFIG_TYPE,
  buildAllConfigPayload,
  buildGroupConfigPayload,
  configFileNameForAll,
  configFileNameForGroup,
  isSupportedConfigType
} from '../config-format.js'

const customGroup = {
  id: 'android',
  name: 'Android',
  rules: [
    {
      id: 'google-play-apk',
      name: 'GooglePlayApk',
      patterns: ['^https://play\\.google\\.com/store/apps/details\\?id=([^&#]+).*'],
      links: [
        {
          id: 'apkpure',
          label: 'ApkPure',
          icon: 'lucide:package',
          url: 'https://apkpure.com/cn/store/apps/details?id={1}',
          desc: 'download in apk pure'
        }
      ]
    }
  ]
}

assert.equal(CONFIG_TYPE, 'fork-url-config')
assert.equal(isSupportedConfigType('fork-url-config'), true)
assert.equal(isSupportedConfigType('url-switcher-config'), true)
assert.equal(isSupportedConfigType('other-config'), false)

{
  const payload = buildAllConfigPayload({
    exportedAt: '2026-05-22T09:30:00.000Z',
    remoteUrl: 'https://example.com/rules.json',
    customGroups: [customGroup],
    disabled: { android: true }
  })
  assert.equal(payload.type, 'fork-url-config')
  assert.equal(payload.exportScope, 'all')
  assert.deepEqual(payload.customGroups, [customGroup])
  assert.deepEqual(payload.disabled, { android: true })
  assert.equal(configFileNameForAll('20260522-1730'), 'fork-url-config-20260522-1730.json')
}

{
  const payload = buildGroupConfigPayload({
    exportedAt: '2026-05-22T09:31:00.000Z',
    group: customGroup,
    disabled: {
      github: true,
      android: true,
      'android/google-play-apk/apkpure': true
    }
  })
  assert.equal(payload.type, 'fork-url-config')
  assert.equal(payload.exportScope, 'group')
  assert.deepEqual(payload.exportedGroup, { id: 'android', name: 'Android' })
  assert.deepEqual(payload.customGroups, [customGroup])
  assert.deepEqual(payload.disabled, {
    android: true,
    'android/google-play-apk/apkpure': true
  })
  assert.equal(configFileNameForGroup('android'), 'fork-url-config-android.json')
}

console.log('config-format tests passed')
