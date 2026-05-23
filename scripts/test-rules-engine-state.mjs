import assert from 'node:assert/strict'

let storage = {}
globalThis.chrome = {
  storage: {
    local: {
      async get () {
        return storage
      }
    }
  }
}

const { getState } = await import('../rules-engine.js')

storage = {}
assert.equal((await getState()).extIcons, true)

storage = { extIcons: false }
assert.equal((await getState()).extIcons, false)

storage = { extIcons: true }
assert.equal((await getState()).extIcons, true)

console.log('rules-engine state tests passed')
