export function isMissingTabError (error) {
  const message = String(error && error.message ? error.message : error || '')
  return /^No tab with id: \d+\.?$/.test(message)
}
