import assert from 'node:assert/strict'

const storage = { iconCache: {} }
globalThis.chrome = {
  storage: {
    local: {
      async get (key) {
        if (key === 'iconCache') return { iconCache: storage.iconCache }
        return {}
      },
      async set (patch) {
        Object.assign(storage, patch)
      }
    }
  }
}

const fetchCalls = []
globalThis.fetch = async (url) => {
  fetchCalls.push(String(url))
  return {
    ok: true,
    async text () {
      return '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>'
    }
  }
}

const {
  clearIconCache,
  getIconCache,
  hydrateIconValues,
  iconHTML,
  normalizeIconKey,
  toIconifyKey
} = await import('../icon-render.js')

await clearIconCache()

assert.equal(normalizeIconKey('lucid:user'), 'lucide:user')
assert.deepEqual(toIconifyKey('lucid:user'), { collection: 'lucide', name: 'user' })
assert.equal(iconHTML('lucide:user'), 'lucide:user')

const hydrated = await hydrateIconValues(['lucid:user', 'lucide:globe', 'plain text'])
assert.deepEqual(hydrated, ['lucide:user'])
assert.equal(fetchCalls.length, 1)
assert.match(fetchCalls[0], /\/lucide\/user\.svg$/)
assert.ok(Object.hasOwn(getIconCache(), 'lucide:user'))
assert.match(iconHTML('lucid:user'), /^<svg /)

console.log('icon-render tests passed')
