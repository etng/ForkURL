#!/usr/bin/env node
// Bump manifest.json version, commit, tag, push.
// CI picks up the tag push and produces a GitHub Release.
//
// Usage:  node scripts/release.mjs <patch|minor|major>
//         (typically invoked via `make release-patch` etc.)

import fs from 'node:fs'
import { execSync } from 'node:child_process'

const bump = process.argv[2]
const dryRun = process.argv.includes('--dry-run')
if (!['patch', 'minor', 'major'].includes(bump)) {
  console.error('Usage: node scripts/release.mjs <patch|minor|major> [--dry-run]')
  process.exit(2)
}

const root = new URL('..', import.meta.url).pathname
process.chdir(root)

function sh (cmd, opts = {}) {
  try {
    const out = execSync(cmd, { stdio: opts.capture ? 'pipe' : 'inherit', encoding: 'utf8' })
    // execSync returns null in inherit mode; only capture mode gives us a string.
    return out == null ? '' : out.toString().trim()
  } catch (e) {
    if (opts.allowFail) throw e
    console.error(`\n✗ Command failed (exit ${e.status}): ${cmd}`)
    if (opts.capture) {
      const out = (e.stdout || '').toString().trim()
      const err = (e.stderr || '').toString().trim()
      if (out) console.error('  stdout:\n' + out.split('\n').map(l => '    ' + l).join('\n'))
      if (err) console.error('  stderr:\n' + err.split('\n').map(l => '    ' + l).join('\n'))
    }
    process.exit(e.status || 1)
  }
}

// ── Sanity checks ────────────────────────────────────────────────────────────
const branch = sh('git rev-parse --abbrev-ref HEAD', { capture: true })
if (branch !== 'main') {
  console.error(`✗ Must be on main (currently: ${branch})`)
  process.exit(1)
}

const dirty = sh('git status --porcelain', { capture: true })
if (dirty) {
  console.error('✗ Working tree is not clean. Commit or stash first:')
  console.error(dirty)
  process.exit(1)
}

console.log('→ Syncing with origin/main')
sh('git fetch --tags origin')
sh('git pull --rebase origin main')

// ── Compute new version ──────────────────────────────────────────────────────
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'))
const m = manifest.version.match(/^(\d+)\.(\d+)\.(\d+)$/)
if (!m) {
  console.error(`✗ manifest.json has unparseable version: ${manifest.version}`)
  process.exit(1)
}
const [maj, min, pat] = [+m[1], +m[2], +m[3]]
const next =
  bump === 'patch' ? `${maj}.${min}.${pat + 1}` :
  bump === 'minor' ? `${maj}.${min + 1}.0` :
                     `${maj + 1}.0.0`
const tag = `v${next}`

// Tag must not already exist
let tagExists = false
try {
  sh(`git rev-parse --verify --quiet refs/tags/${tag}`, { capture: true, allowFail: true })
  tagExists = true
} catch { /* not found — good */ }
if (tagExists) {
  console.error(`✗ Tag ${tag} already exists.`)
  process.exit(1)
}

console.log(`→ Bumping ${manifest.version} → ${next} (${bump})`)
manifest.version = next
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n')

// ── Local build verification ─────────────────────────────────────────────────
console.log(`→ Local build verification (${tag})`)
sh(`bash scripts/build-extension.sh --check-version ${tag}`)

// ── Commit + tag + push ──────────────────────────────────────────────────────
if (dryRun) {
  console.log(`\n[dry-run] would commit + tag ${tag} + push to origin`)
  // Roll back manifest.json so the working tree is clean again
  sh('git checkout -- manifest.json')
  console.log('[dry-run] reverted manifest.json — no changes pushed')
  process.exit(0)
}

sh('git add manifest.json')
sh(`git commit -m "release ${tag}"`)
sh(`git tag ${tag}`)
console.log(`→ Pushing commit and tag ${tag}`)
sh('git push origin main')
sh(`git push origin ${tag}`)

const repo = (() => {
  try {
    const url = sh('git config --get remote.origin.url', { capture: true })
    const m = url.match(/github\.com[:/]([^/]+\/[^/.]+)/)
    return m ? m[1] : null
  } catch { return null }
})()
console.log(`\n✓ Released ${tag}`)
if (repo) {
  console.log(`  Watch:   https://github.com/${repo}/actions`)
  console.log(`  Release: https://github.com/${repo}/releases/tag/${tag}`)
}
