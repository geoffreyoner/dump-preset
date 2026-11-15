const AM_HOSTS = ['alightcreative.com', 'alightmotion.com', 'alightmotion.app']
const XML_HOSTS = ['drive.google.com', 'mega.nz', 'mediafire.com', 'dropbox.com']
const YOUTUBE_HOSTS = ['youtube.com', 'youtu.be', 'youtube-nocookie.com']
const TELEGRAM_HOSTS = ['t.me', 'telegram.me']
const WHATSAPP_CHANNEL_RE = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[^/?#]+/i

const URL_RE = /https?:\/\/[^\s<>"']+/gi

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function isHost(host, domains) {
  return domains.some((d) => host === d || host.endsWith('.' + d))
}

function labelBefore(text, index) {
  const before = text.slice(Math.max(0, index - 14), index)
  const match = before.match(/(\d+(?:[.,]\d+)?\s*mb|xml)\s*$/i)
  return match ? match[1].replace(/\s+/g, '').toLowerCase() : ''
}

function typeOf(url, host, label) {
  if (isHost(host, AM_HOSTS)) return 'AM'
  if (isHost(host, XML_HOSTS) || /\.xml(?:$|[?#])/i.test(url) || label === 'xml') return 'XML'
  if (WHATSAPP_CHANNEL_RE.test(url)) return 'WhatsApp'
  if (isHost(host, YOUTUBE_HOSTS)) return 'YouTube'
  if (isHost(host, TELEGRAM_HOSTS)) return 'Telegram'
  return ''
}

export function extractLinks(text) {
  const results = []
  const seen = new Set()

  for (const match of text.matchAll(URL_RE)) {
    const url = match[0]
      .replace(/[^\w\-./?=&%#~+:@]+$/u, '')
      .replace(/[.,;:!?)\]}'"]+$/, '')
    if (!url) continue

    const host = hostOf(url)
    const label = labelBefore(text, match.index)
    const type = typeOf(url, host, label)
    if (!type) continue

    const key = url.replace(/\/+$/, '').toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    results.push({ url, type, label })
  }

  return results
}
