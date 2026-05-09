import { ICON_LIBRARY } from './icon-library.js'

// Returns trusted innerHTML for an icon value.
// Library refs ("simple:github", "lucide:globe") render as inline SVG;
// anything else is treated as plain text/emoji and HTML-escaped.
export function iconHTML (value) {
  if (typeof value === 'string' && /^(simple|lucide):[\w-]+$/.test(value)) {
    const def = ICON_LIBRARY[value]
    if (def) return def.svg
  }
  return escapeHtml(value || '↗')
}

export function isLibraryIcon (value) {
  return typeof value === 'string' && /^(simple|lucide):[\w-]+$/.test(value) && ICON_LIBRARY[value]
}

export const EMOJI_PRESETS = [
  '🌐', '📄', '💻', '👁', '🔵', '☁️', '⚡', '📦',
  '📊', '🕸', '▶️', '🔐', '🧩', '📓', '🚀', '📡',
  '⚖️', '🏛', '🔍', '✨', '🛠', '🧪', '🔗', '📚',
  '🎯', '💡', '🔥', '⭐', '🚦', '📌', '🤖', '🧠'
]

function escapeHtml (s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
