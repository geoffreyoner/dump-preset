const API = 'https://www.tikwm.com/api'
const PAGE_SIZE = 50
const MAX_PAGES = 6
const MAX_REPLY_THREADS = 5
const MIN_GAP = 1100
const cache = new Map()

let lastCall = 0

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForSlot() {
  const wait = Math.max(0, lastCall + MIN_GAP - Date.now())
  if (wait) await sleep(wait)
  lastCall = Date.now()
}

export function findTikTokUrl(value) {
  const match = value.match(/https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/\S+/i)
  return match ? match[0].replace(/[.,;:!?)\]}'"]+$/, '') : ''
}

export function isTikTokUrl(value) {
  return findTikTokUrl(value) !== ''
}

export function buildText(info, comments) {
  const title = info?.title || ''
  const texts = (comments || []).map((comment) => comment?.text || '').filter(Boolean)
  return [title, ...texts].filter(Boolean).join('\n')
}

async function getJson(path, params, attempt = 0) {
  await waitForSlot()
  const response = await fetch(`${API}${path}?${new URLSearchParams(params)}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const body = await response.json()
  if (body.code !== 0) {
    if (attempt < 2 && /limit/i.test(body.msg || '')) {
      return getJson(path, params, attempt + 1)
    }
    throw new Error(body.msg || 'Gagal mengambil data TikTok')
  }
  return body.data
}

export async function collectComments(fetchPage, maxPages = MAX_PAGES) {
  const comments = []
  let cursor = '0'

  for (let page = 0; page < maxPages; page++) {
    let data
    try {
      data = await fetchPage(cursor)
    } catch (error) {
      if (comments.length > 0) break
      throw error
    }

    const batch = data?.comments || []
    comments.push(...batch)
    if (!data?.hasMore || batch.length === 0) break
    cursor = String(data.cursor ?? Number(cursor) + batch.length)
  }

  return comments
}

export function pickReplyThreads(comments, max = MAX_REPLY_THREADS) {
  return (comments || [])
    .filter((comment) => (comment?.reply_total || 0) > 0 && comment?.id)
    .sort((a, b) => (b.reply_total || 0) - (a.reply_total || 0))
    .slice(0, max)
}

function videoIdFrom(url, comments) {
  const fromComments = (comments || []).find((comment) => comment?.video_id)?.video_id
  return fromComments || (url.match(/\/video\/(\d+)/) || [])[1] || ''
}

async function fetchReplies(url, comments) {
  const videoId = videoIdFrom(url, comments)
  if (!videoId) return []

  const replies = []
  for (const thread of pickReplyThreads(comments)) {
    try {
      const data = await getJson('/comment/reply', {
        video_id: videoId,
        comment_id: thread.id,
        count: String(PAGE_SIZE),
        cursor: '0',
      })
      replies.push(...(data?.comments || []))
    } catch {
      continue
    }
  }

  return replies
}

// shortcut: maks 6 halaman komentar (300) + 5 thread balasan (50/thread) karena
// API dibatasi 1 request/detik; naikkan konstanta kalau link masih sering tidak ketemu.
export function fetchTikTokText(url) {
  const key = url.replace(/[?#].*$/, '')
  if (cache.has(key)) return cache.get(key)

  const request = (async () => {
    let info = {}
    try {
      info = await getJson('/', { url })
    } catch {
      info = {}
    }

    const comments = await collectComments((cursor) =>
      getJson('/comment/list/', { url, count: String(PAGE_SIZE), cursor }),
    )
    const replies = await fetchReplies(url, comments)

    return { text: buildText(info, [...comments, ...replies]) }
  })().catch((error) => {
    cache.delete(key)
    throw error
  })

  cache.set(key, request)
  return request
}
