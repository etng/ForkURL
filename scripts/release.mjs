#!/usr/bin/env node
// Bump manifest.json version, commit, tag, push.
// CI picks up the tag push and produces a GitHub Release.
//
// Usage:  node scripts/release.mjs <patch|minor|major>
//         (typically invoked via `make release-patch` etc.)

import fs from 'node:fs'
import { execSync } from 'node:child_process'

const bump = process.argv[2]
if (!['patch', 'minor', 'major'].includes(bump)) {
  console.error('Usage: node scripts/release.mjs <patch|minor|major>')
  process.exit(2)
}

const root = new URL('..', import.meta.url).pathname
process.chdir(root)

function sh (cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: opts.capture ? 'pipe' : 'inherit', encoding: 'utf8' }).toString().trim()
  } catch (e) {
    if (opts.capture) throw e
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

console.log('→ Fetching latest from origin')
sh('git fetch --quiet --tags origin')
const localSha = sh('git rev-parse @', { capture: true })
const remoteSha = sh('git rev-parse @{u}', { capture: true })
if (localSha !== remoteSha) {
  console.error('✗ Local main differs from origin/main. Run `git pull --rebase` first.')
  process.exit(1)
}

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
try {
  sh(`git rev-parse --verify --quiet refs/tags/${tag}`, { capture: true })
  console.error(`✗ Tag ${tag} already exists.`)
  process.exit(1)
} catch { /* not found — good */ }

console.log(`→ Bumping ${manifest.version} → ${next} (${bump})`)
manifest.version = next
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n')

// ── Local build verification ─────────────────────────────────────────────────
console.log(`→ Local build verification (${tag})`)
sh(`bash scripts/build-extension.sh --check-version ${tag}`)

// ── Commit + tag + push ──────────────────────────────────────────────────────
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
