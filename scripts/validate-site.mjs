import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteDir = path.join(rootDir, 'site')
const htmlFiles = ['index.html', 'privacy.html']
const i18nSource = fs.readFileSync(path.join(siteDir, 'i18n.js'), 'utf8')
const sandbox = {
  __FORKURL_SITE_I18N_TEST__: true
}

vm.runInNewContext(i18nSource, sandbox, {
  filename: 'site/i18n.js'
})

const messages = sandbox.__forkurlSiteMessages
if (!messages || !messages.zh || !messages.en) {
  throw new Error('site/i18n.js did not expose zh/en dictionaries for validation')
}

const requiredKeys = new Set()
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(siteDir, file), 'utf8')
  for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) {
    requiredKeys.add(match[1])
  }
  for (const match of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    const pairs = match[1].split(';')
    for (const pair of pairs) {
      const [, key] = pair.split(':').map((item) => item.trim())
      if (key) requiredKeys.add(key)
    }
  }
}

const missing = []
for (const language of ['zh', 'en']) {
  for (const key of requiredKeys) {
    if (!messages[language][key]) {
      missing.push(`${language}:${key}`)
    }
  }
}

if (missing.length) {
  throw new Error(`Missing i18n keys:\n${missing.join('\n')}`)
}

console.log(`✓ ${requiredKeys.size} site i18n keys defined for zh/en`)
