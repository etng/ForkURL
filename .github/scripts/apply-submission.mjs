#!/usr/bin/env node
// Parse a rule-submission Issue body, validate, optionally apply to rules.json.
//
// Usage:
//   node apply-submission.mjs validate  < issue-body.md
//   node apply-submission.mjs apply     < issue-body.md
//
// The Issue body is read from stdin. The script prints a markdown report to stdout
// and exits non-zero on validation failure (so the action can branch on $?).

import fs from 'node:fs'
import path from 'node:path'

const RULES_PATH = path.resolve('rules.json')

function readStdin () {
  return fs.readFileSync(0, 'utf8')
}

// Parse GitHub Issue Form body into { fieldLabel: value } map.
// Sections look like:  "### Field Label\n\nvalue text\n\n### Next Field..."
function parseIssueBody (body) {
  const out = {}
  const re = /^###\s+(.+?)\s*\n([\s\S]*?)(?=^###\s+)/gm
  let m
  while ((m = re.exec(body + '\n###'))) {
    const key = m[1].trim()
    let val = m[2].trim()
    if (val === '_No response_' || val === '*No response*') val = ''
    out[key] = val
  }
  return out
}

// Field labels from .github/ISSUE_TEMPLATE/submit-rule.yml
const F = {
  groupId: '目标组 ID',
  groupName: '目标组显示名（新建组时必填）',
  ruleId: '规则 ID',
  ruleName: '规则显示名',
  patterns: '匹配正则（一行一个）',
  links: '链接列表（JSON 数组）'
}

function buildSubmission (fields) {
  const errors = []
  const groupId = (fields[F.groupId] || '').trim()
  const groupName = (fields[F.groupName] || '').trim()
  const ruleId = (fields[F.ruleId] || '').trim()
  const ruleName = (fields[F.ruleName] || '').trim()
  const patternsRaw = (fields[F.patterns] || '').trim()
  const linksRaw = (fields[F.links] || '').trim()

  if (!/^[a-z0-9][a-z0-9-]*$/.test(groupId)) errors.push('`group_id` 必须是 kebab-case（小写字母/数字/`-`）')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(ruleId)) errors.push('`rule_id` 必须是 kebab-case')
  if (!ruleName) errors.push('`rule_name` 不能为空')

  const patterns = patternsRaw.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  if (!patterns.length) errors.push('至少要有 1 条 pattern')
  for (const p of patterns) {
    try { new RegExp(p) } catch (e) { errors.push(`pattern 编译失败: \`${p}\` — ${e.message}`) }
  }

  let links = []
  try {
    const stripped = linksRaw.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
    links = JSON.parse(stripped)
  } catch (e) {
    errors.push('`links` 不是合法 JSON: ' + e.message)
  }
  if (!Array.isArray(links)) errors.push('`links` 必须是 JSON 数组')
  else if (!links.length) errors.push('至少要有 1 个 link')
  else {
    for (const [i, l] of links.entries()) {
      if (!l || typeof l !== 'object') { errors.push(`link[${i}] 必须是对象`); continue }
      for (const k of ['id', 'label', 'url']) if (!l[k] || typeof l[k] !== 'string') errors.push(`link[${i}].${k} 必须是非空字符串`)
      if (!/^[a-z0-9][a-z0-9-]*$/.test(l.id || '')) errors.push(`link[${i}].id 必须是 kebab-case`)
    }
  }

  return {
    errors,
    groupId,
    groupName,
    rule: { id: ruleId, name: ruleName, patterns, links }
  }
}

function loadRules () {
  return JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'))
}

function applyToRules (rules, submission) {
  const out = JSON.parse(JSON.stringify(rules))
  let group = out.groups.find(g => g.id === submission.groupId)
  if (!group) {
    if (!submission.groupName) {
      throw new Error(`组 \`${submission.groupId}\` 不存在；新建组必须填 \`group_name\``)
    }
    group = { id: submission.groupId, name: submission.groupName, rules: [] }
    out.groups.push(group)
  }
  if (group.rules.some(r => r.id === submission.rule.id)) {
    throw new Error(`组 \`${submission.groupId}\` 中已存在规则 \`${submission.rule.id}\``)
  }
  group.rules.push(submission.rule)
  return out
}

// ── Main ────────────────────────────────────────────────────────────────────
const mode = process.argv[2] || 'validate'
const body = readStdin()
const fields = parseIssueBody(body)
const sub = buildSubmission(fields)

const lines = []
lines.push(`### 提交内容预览`)
lines.push('')
lines.push(`- **组**: \`${sub.groupId}\`${sub.groupName ? ` (${sub.groupName})` : ''}`)
lines.push(`- **规则**: \`${sub.rule.id}\` — ${sub.rule.name}`)
lines.push(`- **patterns** (${sub.rule.patterns.length}):`)
for (const p of sub.rule.patterns) lines.push(`  - \`${p}\``)
lines.push(`- **links** (${sub.rule.links.length}):`)
for (const l of sub.rule.links) lines.push(`  - ${l.icon || '↗'} **${l.label}** → \`${l.url}\``)
lines.push('')

if (sub.errors.length) {
  lines.push(`### ❌ 校验失败`)
  lines.push('')
  for (const e of sub.errors) lines.push(`- ${e}`)
  process.stdout.write(lines.join('\n') + '\n')
  process.exit(1)
}

if (mode === 'apply') {
  try {
    const rules = loadRules()
    const updated = applyToRules(rules, sub)
    fs.writeFileSync(RULES_PATH, JSON.stringify(updated, null, 2) + '\n')
    lines.push(`### ✅ 已合并到 \`rules.json\``)
    lines.push('')
    lines.push(`新增 1 条规则到组 \`${sub.groupId}\`。下次自动同步（最长 6 小时）后所有用户可见。`)
  } catch (e) {
    lines.push(`### ❌ 应用失败`)
    lines.push('')
    lines.push('- ' + e.message)
    process.stdout.write(lines.join('\n') + '\n')
    process.exit(1)
  }
} else {
  lines.push(`### ✅ 校验通过`)
  lines.push('')
  lines.push('维护者评论 `/approve` 后将自动写入 `rules.json` 并关闭此 Issue。')
}

process.stdout.write(lines.join('\n') + '\n')
