import assert from 'node:assert/strict'

import { isMissingTabError } from '../extension-errors.js'

assert.equal(isMissingTabError(new Error('No tab with id: 586238134.')), true)
assert.equal(isMissingTabError('No tab with id: 42.'), true)
assert.equal(isMissingTabError({ message: 'No tab with id: 7.' }), true)
assert.equal(isMissingTabError(new Error('Cannot access a chrome:// URL')), false)
assert.equal(isMissingTabError(null), false)

console.log('extension-errors tests passed')
