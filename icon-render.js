import { ICON_LIBRARY } from './icon-library.js'

// Synchronous icon cache mirror of chrome.storage.local["iconCache"].
// Call loadIconCache() once per page (popup/options) before rendering.
let cachedIcons = {}

export async function loadIconCache () {
  try {
    const data = await chrome.storage.local.get('iconCache')
    cachedIcons = data.iconCache || {}
  } catch {
    cachedIcons = {}
  }
}

// Returns trusted innerHTML for an icon value.
// Resolution order: bundled library → runtime cache → plain text/emoji.
export function iconHTML (value) {
  if (typeof value === 'string' && /^[\w-]+:[\w.-]+$/.test(value)) {
    if (ICON_LIBRARY[value]) return ICON_LIBRARY[value].svg
    if (cachedIcons[value]) return cachedIcons[value]
  }
  return escapeHtml(value || '↗')
}

export function isLibraryIcon (value) {
  return typeof value === 'string'
    && /^[\w-]+:[\w.-]+$/.test(value)
    && (ICON_LIBRARY[value] || cachedIcons[value])
}

// Convert our internal prefix to Iconify's collection slug.
// We use "simple:" / "lucide:" internally; Iconify expects "simple-icons" / "lucide".
export function toIconifyKey (key) {
  const i = key.indexOf(':')
  if (i < 0) return null
  const prefix = key.slice(0, i)
  const name = key.slice(i + 1)
  const collection = prefix === 'simple' ? 'simple-icons' : prefix
  return { collection, name }
}

// Fetch a single icon SVG from Iconify, normalize, persist to cache.
export async function fetchAndCacheIcon (key) {
  const ck = toIconifyKey(key)
  if (!ck) throw new Error('图标 key 格式错误')
  const url = `https://api.iconify.design/${ck.collection}/${ck.name}.svg`
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  if (!text.startsWith('<svg')) throw new Error('返回内容不是 SVG（图标可能不存在）')
  const normalized = normalizeIconifySvg(text)
  cachedIcons[key] = normalized
  await chrome.storage.local.set({ iconCache: cachedIcons })
  return normalized
}

// Search the Iconify registry. Returns array of { key, label }.
export async function searchIconify (query, { limit = 64 } = {}) {
  if (!query || query.length < 2) return []
  const url = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}&prefixes=lucide,simple-icons`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Iconify 搜索失败：HTTP ${res.status}`)
  const data = await res.json()
  return (data.icons || []).map(full => {
    // full is "simple-icons:github" → we store as "simple:github"
    const [coll, name] = full.split(':')
    const ourPrefix = coll === 'simple-icons' ? 'simple' : coll
    return { key: `${ourPrefix}:${name}`, label: name, collection: coll }
  })
}

export async function clearIconCache () {
  cachedIcons = {}
  await chrome.storage.local.set({ iconCache: {} })
}

export function getIconCache () {
  return cachedIcons
}

function normalizeIconifySvg (svg) {
  let s = svg.replace(/\s+/g, ' ').trim()
  // Replace any explicit width/height with 1em.
  s = s.replace(/<svg([^>]*)>/, (_, attrs) => {
    const a = attrs.replace(/\s(width|height)="[^"]*"/g, '')
    return `<svg width="1em" height="1em" aria-hidden="true"${a}>`
  })
  return s
}

function escapeHtml (s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export const EMOJI_PRESETS = [
  '🌐', '📄', '💻', '👁', '🔵', '☁️', '⚡', '📦',
  '📊', '🕸', '▶️', '🔐', '🧩', '📓', '🚀', '📡',
  '⚖️', '🏛', '🔍', '✨', '🛠', '🧪', '🔗', '📚',
  '🎯', '💡', '🔥', '⭐', '🚦', '📌', '🤖', '🧠'
]
