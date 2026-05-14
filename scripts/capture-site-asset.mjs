import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixtureUrl = pathToFileURL(path.join(rootDir, 'scripts/fixtures/forkurl-site-shot.html')).href
const outputPath = path.join(rootDir, 'site/assets/forkurl-popup.png')

await execFileAsync('npx', [
  '--yes',
  'playwright',
  'screenshot',
  '--channel=chrome',
  '--viewport-size=1120,700',
  '--wait-for-selector=.shot',
  fixtureUrl,
  outputPath
], {
  cwd: rootDir,
  maxBuffer: 1024 * 1024
})

console.log(`✓ wrote ${path.relative(rootDir, outputPath)}`)
