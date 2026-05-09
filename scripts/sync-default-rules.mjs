#!/usr/bin/env node
// Regenerate default-rules.js from rules.json so the bundled defaults stay
// in sync with the published remote rule set.

import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const rulesPath = path.join(root, 'rules.json')
const outPath = path.join(root, 'default-rules.js')

const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'))

const header =
  '// Auto-generated from rules.json by scripts/sync-default-rules.mjs.\n' +
  '// Do not edit by hand — edit rules.json or submit a regular issue, then run:\n' +
  '//   node scripts/sync-default-rules.mjs\n' +
  '\n' +
  '// Schema: { version, groups: [{ id, name, rules: [{ id, name, patterns: [regex], links: [{ id, label, icon, url, desc }] }] }] }\n' +
  '// URL templates use {1}, {2}, ... to reference regex capture groups.\n' +
  '// Icons can be: a library ref like "simple:github" / "lucide:globe", an emoji, or any text fallback.\n\n'

fs.writeFileSync(outPath, header + 'export const DEFAULT_RULES = ' + JSON.stringify(rules, null, 2) + '\n')
console.log(`wrote ${path.relative(root, outPath)} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB, ${rules.groups.length} groups)`)
