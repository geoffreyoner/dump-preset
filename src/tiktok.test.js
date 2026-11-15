import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findTikTokUrl, isTikTokUrl, buildText, collectComments, pickReplyThreads } from './tiktok.js'

test('finds TikTok URLs including short links and strips trailing punctuation', () => {
  assert.equal(
    findTikTokUrl('lihat https://www.tiktok.com/@user/video/123?is_from_webapp=1, oke'),
    'https://www.tiktok.com/@user/video/123?is_from_webapp=1',
  )
  assert.equal(findTikTokUrl('https://vt.tiktok.com/ZSabc/'), 'https://vt.tiktok.com/ZSabc/')
  assert.equal(findTikTokUrl('https://www.tiktok.com/@a/video/1.'), 'https://www.tiktok.com/@a/video/1')
})

test('rejects non-TikTok URLs', () => {
  assert.equal(findTikTokUrl('https://alightcreative.com/am/share/x'), '')
  assert.equal(isTikTokUrl('https://notiktok.com/video/1'), false)
  assert.equal(isTikTokUrl('https://tiktok.com.evil.id/x'), false)
})

test('merges caption and comments into text, skipping empties', () => {
  const text = buildText({ title: 'preset baru' }, [
    { text: '5mbhttps://alightcreative.com/am/share/x' },
    { text: '' },
    {},
    { text: 'xmlhttps://drive.google.com/file/d/y/view' },
  ])
  assert.equal(
    text,
    'preset baru\n5mbhttps://alightcreative.com/am/share/x\nxmlhttps://drive.google.com/file/d/y/view',
  )
})

test('handles missing caption and comments', () => {
  assert.equal(buildText(null, null), '')
  assert.equal(buildText({}, []), '')
})

test('collects comments across pages until hasMore is false', async () => {
  const pages = [
    { comments: [{ text: 'a' }, { text: 'b' }], cursor: 2, hasMore: true },
    { comments: [{ text: 'c' }], cursor: 3, hasMore: false },
  ]
  const cursors = []
  const comments = await collectComments(async (cursor) => {
    cursors.push(cursor)
    return pages.shift()
  })
  assert.equal(comments.length, 3)
  assert.deepEqual(cursors, ['0', '2'])
})

test('stops collecting at max pages', async () => {
  const comments = await collectComments(
    async () => ({ comments: [{ text: 'x' }], cursor: 1, hasMore: true }),
    3,
  )
  assert.equal(comments.length, 3)
})

test('keeps earlier comments when a later page fails', async () => {
  let call = 0
  const comments = await collectComments(async () => {
    call += 1
    if (call === 2) throw new Error('limit')
    return { comments: [{ text: 'x' }], cursor: 1, hasMore: true }
  })
  assert.equal(comments.length, 1)
})

test('fails when the first page fails', async () => {
  await assert.rejects(() =>
    collectComments(async () => {
      throw new Error('boom')
    }),
  )
})

test('picks the most replied threads and ignores zero replies', () => {
  const threads = pickReplyThreads(
    [
      { id: 'a', reply_total: 2 },
      { id: 'b', reply_total: 0 },
      { id: 'c', reply_total: 9 },
      { id: 'd' },
      { id: 'e', reply_total: 5 },
    ],
    2,
  )
  assert.deepEqual(
    threads.map((thread) => thread.id),
    ['c', 'e'],
  )
})

test('handles missing comments when picking reply threads', () => {
  assert.deepEqual(pickReplyThreads(null), [])
  assert.deepEqual(pickReplyThreads([]), [])
})
