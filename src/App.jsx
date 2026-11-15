import { useState } from 'react'
import { extractLinks } from './extract.js'
import { findTikTokUrl, fetchTikTokText } from './tiktok.js'

export default function App() {
  const [text, setText] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    let source = text
    const tiktokUrl = findTikTokUrl(text)
    if (tiktokUrl) {
      try {
        const fetched = await fetchTikTokText(tiktokUrl)
        source = `${text}\n${fetched.text}`
      } catch {
        setError('Gagal mengambil data TikTok. Teks yang ditempel tetap diproses.')
      }
    }

    setResults(extractLinks(source))
    setLoading(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      event.currentTarget.form.requestSubmit()
    }
  }

  function clear() {
    setText('')
    setResults(null)
    setError('')
  }

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">/ TikTok &mdash; Alight Motion /</p>
        <h1 className="hero-title">
          Dump Preset<span className="dot">.</span>
        </h1>
        <p className="hero-desc">Tempel link video TikTok.</p>
      </header>

      <form className="card" onSubmit={handleSearch}>
        <label className="field-label" htmlFor="source">
          Sumber
        </label>
        <textarea
          id="source"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
          autoFocus
          placeholder="Tempel link video TikTok..."
        />
        <div className="actions">
          <button type="submit" className="btn btn--solid" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Mencari...
              </>
            ) : (
              'Cari'
            )}
          </button>
          {(text || results) && (
            <button type="button" className="btn" onClick={clear}>
              Bersihkan
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="status" role="status" aria-live="polite">
          {error}
        </p>
      )}

      {results !== null && (
        <section className="results" aria-live="polite">
          <div className="results-head">
            <span className="count">/ {results.length} link</span>
          </div>

          {results.length === 0 ? (
            <p className="empty">Tidak ada link AlightLink atau XML.</p>
          ) : (
            <ul>
              {results.map((item, index) => (
                <li key={item.url}>
                  <span className="idx">{String(index + 1).padStart(2, '0')}</span>
                  <div className="content">
                    <div className="tags">
                      <span className="tag">{item.type === 'AM' ? 'AlightLink' : item.type}</span>
                      {item.label && <span className="tag">{item.label}</span>}
                    </div>
                    <a
                      className="link"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      title={item.url}
                    >
                      {item.url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                  <a className="open" href={item.url} target="_blank" rel="noreferrer noopener">
                    Open <span className="arrow" aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <footer className="footer">
        <p>&copy; 2026 Dump Preset</p>
        <a href="https://tako.id/gxmysz" target="_blank" rel="noreferrer noopener">
          Traktir <span className="arrow" aria-hidden="true">↗</span>
        </a>
      </footer>
    </main>
  )
}
