'use client'

import { useState, useCallback } from 'react'

interface Analysis {
  sentiment: string
  sentimentScore: number
  summary: string
  keyThemes: string[]
  writingStyle: string
  tone: string
  readabilityScore: number
  readabilityLabel: string
  suggestedImprovements: string[]
  wordCount: number
  estimatedReadTime: string
}

export default function Home() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Analysis | null>(null)
  const [error, setError] = useState('')

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  const analyze = useCallback(async () => {
    if (!text.trim() || text.trim().split(/\s+/).length < 3) {
      setError('Please enter at least 3 words of text to analyze.')
      return
    }

    setError('')
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`)
      }

      setResult(data.analysis)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze text. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [text])

  const clearAll = () => {
    setText('')
    setResult(null)
    setError('')
  }

  const getSentimentClass = (s: string) => {
    if (s === 'positive') return 'sentiment-positive'
    if (s === 'negative') return 'sentiment-negative'
    return 'sentiment-neutral'
  }

  const getMeterColor = (score: number) => {
    if (score >= 70) return '#66bb6a'
    if (score >= 40) return '#ffa726'
    return '#ef5350'
  }

  const getSentimentEmoji = (s: string) => {
    if (s === 'positive') return '😊'
    if (s === 'negative') return '😟'
    return '😐'
  }

  return (
    <div className="container">
      <header>
        <div className="hero-badge">🚀 Powered by AI</div>
        <h1>AI Text Intelligence</h1>
        <p>Paste any text and get instant AI-powered analysis — sentiment, key themes, writing style, tone, and readability insights.</p>
      </header>

      <div className="analyzer-card">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type any text here to analyze... (at least 3 words)"
        />

        <div className="stats-bar">
          <span>📝 {wordCount} words</span>
          <span>📏 {charCount} characters</span>
          {result && <span>⏱️ {result.estimatedReadTime}</span>}
        </div>

        <div className="btn-row">
          <button
            className="btn btn-primary"
            onClick={analyze}
            disabled={loading || text.trim().length < 10}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Analyzing...
              </>
            ) : (
              <>
                🔍 Analyze Text
              </>
            )}
          </button>
          {(text || result) && (
            <button className="btn btn-secondary" onClick={clearAll}>
              🗑️ Clear
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {loading && !result && (
        <div className="results-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="result-card">
              <div style={{ height: 14, width: '60%', marginBottom: 12 }} className="skeleton" />
              <div style={{ height: 80 }} className="skeleton" />
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="results-grid">
          <div className="result-card">
            <h3>😊 Sentiment</h3>
            <span className={`sentiment-badge ${getSentimentClass(result.sentiment)}`}>
              {getSentimentEmoji(result.sentiment)} {result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)}
            </span>
            <div style={{ marginTop: 10 }}>
              <div className="section-label">Confidence • {(result.sentimentScore * 100).toFixed(0)}%</div>
              <div className="meter-bar">
                <div className="meter-fill" style={{
                  width: `${(result.sentimentScore * 100)}%`,
                  background: getMeterColor(result.sentimentScore * 100)
                }} />
              </div>
            </div>
          </div>

          <div className="result-card">
            <h3>📖 Readability</h3>
            <div className="readability-meter">
              <span className="sentiment-badge" style={{
                background: `${getMeterColor(result.readabilityScore)}22`,
                color: getMeterColor(result.readabilityScore),
                borderColor: `${getMeterColor(result.readabilityScore)}44`
              }}>
                {result.readabilityLabel}
              </span>
              <div className="meter-bar">
                <div className="meter-fill" style={{
                  width: `${result.readabilityScore}%`,
                  background: getMeterColor(result.readabilityScore)
                }} />
              </div>
              <div className="section-label" style={{ marginTop: 6 }}>Score: {result.readabilityScore}/100</div>
            </div>
          </div>

          <div className="result-card">
            <h3>✍️ Writing Style</h3>
            <span className="tag">{result.writingStyle}</span>
            <h3 style={{ marginTop: 16 }}>🎯 Tone</h3>
            <span className="tag">{result.tone}</span>
          </div>

          <div className="result-card">
            <h3>📊 Key Themes</h3>
            <div className="tag-list">
              {result.keyThemes.map((theme, i) => (
                <span key={i} className="tag">{theme}</span>
              ))}
            </div>
          </div>

          <div className="result-card full-width">
            <h3>📝 Summary</h3>
            <p className="summary-text">{result.summary}</p>
          </div>

          {result.suggestedImprovements.length > 0 && (
            <div className="result-card full-width">
              <h3>💡 Suggested Improvements</h3>
              <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
                {result.suggestedImprovements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!loading && !result && !error && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🤖</div>
          <p>Paste text above and click <strong>Analyze Text</strong></p>
          <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Try articles, emails, essays, or any text you want to understand better</p>
        </div>
      )}

      <footer>
        <p>Built with Next.js · Powered by MiMo AI · <a href="https://github.com/Lievuk/ai-text-intel" target="_blank" rel="noopener noreferrer">GitHub</a></p>
      </footer>
    </div>
  )
}
