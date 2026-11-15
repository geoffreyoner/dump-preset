import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractLinks } from './extract.js'

const SAMPLE =
  '@Paizz:⎙ 5mbhttps://alightcreative.com/am/share/u/f7ITzoS3GMV1vlMCjxKiRS0eiE22/p/uRyv3pFrW6-0b34625cb455cde5⎙ xmlhttps://drive.google.com/file/d/1_86WW9Pc59swfTN5dNlj8PldPUg6g4wX/view?usp=drivesdk'

test('extracts AM and XML links with labels from the sample caption', () => {
  const links = extractLinks(SAMPLE)
  assert.equal(links.length, 2)
  assert.deepEqual(links[0], {
    url: 'https://alightcreative.com/am/share/u/f7ITzoS3GMV1vlMCjxKiRS0eiE22/p/uRyv3pFrW6-0b34625cb455cde5',
    type: 'AM',
    label: '5mb',
  })
  assert.deepEqual(links[1], {
    url: 'https://drive.google.com/file/d/1_86WW9Pc59swfTN5dNlj8PldPUg6g4wX/view?usp=drivesdk',
    type: 'XML',
    label: 'xml',
  })
})

test('ignores unrelated links', () => {
  assert.deepEqual(extractLinks('follow https://tiktok.com/@x dan https://instagram.com/x'), [])
})

test('dedupes repeated links and strips trailing punctuation', () => {
  const links = extractLinks(
    'cek https://alightmotion.app/p/abc, lalu https://alightmotion.app/p/abc. dan https://alightmotion.app/p/abc/',
  )
  assert.equal(links.length, 1)
  assert.equal(links[0].url, 'https://alightmotion.app/p/abc')
})

test('treats .xml file links as XML', () => {
  const links = extractLinks('preset: https://contoh.id/file/preset.xml?x=1')
  assert.equal(links.length, 1)
  assert.equal(links[0].type, 'XML')
})

test('returns empty for text without links', () => {
  assert.deepEqual(extractLinks('tidak ada link di sini'), [])
})

test('extracts WhatsApp channel, YouTube, and Telegram links', () => {
  const links = extractLinks(
    'wa https://whatsapp.com/channel/abcde yt https://youtu.be/xyz123 tg https://t.me/namachannel',
  )
  assert.deepEqual(
    links.map((link) => [link.type, link.url]),
    [
      ['WhatsApp', 'https://whatsapp.com/channel/abcde'],
      ['YouTube', 'https://youtu.be/xyz123'],
      ['Telegram', 'https://t.me/namachannel'],
    ],
  )
})

test('ignores non-channel WhatsApp links', () => {
  assert.deepEqual(extractLinks('https://www.whatsapp.com/download'), [])
})

