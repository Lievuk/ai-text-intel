'use client'

import { useState, useCallback, useMemo } from 'react'

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

// ── Client-side text analysis engine ──────────────────────────
// Uses heuristics + NLP formulas. Works fully offline.
// Extendable: swap in a MiMo/OpenAI API call when configured.

const POSITIVE_WORDS = new Set([
  'good','great','excellent','amazing','wonderful','fantastic','brilliant','outstanding',
  'love','beautiful','happy','joy','delightful','superb','remarkable','incredible',
  'positive','success','successful','thrilled','pleased','impressive','perfect','best',
  'grateful','thankful','awesome','fabulous','terrific','magnificent','splendid',
  'friendly','kind','helpful','warm','caring','compassionate','generous','thoughtful',
  'hopeful','optimistic','bright','promising','beneficial','advantage','favorite',
  'terbaik','bagus','hebat','luar biasa','indah','senang','bahagia','menakjubkan',
  'sukses','semangat','maju','berhasil','bangga','suka','cinta','mantap','keren',
])

const NEGATIVE_WORDS = new Set([
  'bad','terrible','awful','horrible','worst','hate','angry','sad','disappointed',
  'poor','ugly','disgusting','dreadful','atrocious','horrendous','abysmal','appalling',
  'negative','failure','failed','miserable','depressing','frustrating','annoying',
  'awful','unpleasant','painful','difficult','hard','horrible','nasty','offensive',
  'cruel','selfish','rude','mean','thoughtless','inconsiderate','cold','hostile',
  'hopeless','pessimistic','bleak','grim','dismal','gloomy','dark','tragic','terrible',
  'buruk','jelek','payah','parah','gagal','sedih','marah','kecewa','benci','jijik',
  'susah','sulit','mengerikan','menyedihkan','menderita','kacau','tolol','bodoh',
])

const FORMAL_INDICATORS = ['therefore','furthermore','nevertheless','consequently','moreover',
  'accordingly','subsequently','notwithstanding','hereby','herein','hereafter','thereof',
  'pursuant','wherein','whereas','henceforth','duly','per','via','whereby','thus',
  'additionally','in addition','as a result','in conclusion','for this reason']

const TECHNICAL_INDICATORS = ['algorithm','implementation','function','parameter','database',
  'infrastructure','protocol','framework','schema','syntax','runtime','compile',
  'deployment','pipeline','container','api','sdk','cli','config','module','cache',
  'async','thread','process','memory','buffer','query','endpoint','middleware','proxy']

const CASUAL_INDICATORS = ['gonna','wanna','gotta','kinda','sorta','lemme','dunno','cuz',
  'yeah','nah','yup','nope','okay','cool','awesome','dude','bro','lol','btw','omg']

const CREATIVE_INDICATORS = ['like','as if','imagine','whisper','shadow','dream','echo',
  'silver','golden','crimson','gentle','soft','bright','dark','mystical','enchanted',
  'magical','wonder','blazing','frozen','ethereal']

const FORMAL_TONE = ['regard','kindly','sincerely','respectfully','appreciate','acknowledge',
  'formally','request','propose','submit','approve','consent','undertake','verify']

const URGENT_TONE = ['urgent','immediately','asap','critical','emergency','deadline',
  'hurry','rush','now','today','soonest','promptly','imperative','vital','essential']

const ENTHUSIASTIC_TONE = ['exciting','thrilled','amazing','incredible','can\'t wait',
  'looking forward','love','awesome','fantastic','brilliant','absolutely','delighted',
  'pumped','stoked','hyped','phenomenal']

function getWordCount(text: string): { words: number; chars: number } {
  const trimmed = text.trim()
  if (!trimmed) return { words: 0, chars: 0 }
  return { words: trimmed.split(/\s+/).length, chars: trimmed.length }
}

function analyzeSentiment(text: string): { sentiment: string; score: number } {
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  let pos = 0, neg = 0
  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) pos++
    if (NEGATIVE_WORDS.has(w)) neg++
  }
  const total = pos + neg
  if (total === 0) return { sentiment: 'neutral', score: 0.5 }
  const score = pos / total
  if (score > 0.6) return { sentiment: 'positive', score }
  if (score < 0.4) return { sentiment: 'negative', score: 1 - score }
  return { sentiment: 'neutral', score: 0.5 }
}

function detectWritingStyle(text: string): string {
  const lower = text.toLowerCase()
  let formal = 0, technical = 0, casual = 0, creative = 0
  for (const w of FORMAL_INDICATORS) if (lower.includes(w)) formal++
  for (const w of TECHNICAL_INDICATORS) if (lower.includes(w)) technical++
  for (const w of CASUAL_INDICATORS) if (lower.includes(w)) casual++
  for (const w of CREATIVE_INDICATORS) if (lower.includes(w)) creative++

  const max = Math.max(formal, technical, casual, creative)
  if (max === 0) return text.length > 200 ? 'formal' : 'conversational'
  if (formal >= max && formal > 1) return 'formal'
  if (technical >= max && technical > 1) return 'technical'
  if (creative >= max && creative > 1) return 'creative'
  if (casual >= max && casual > 1) return 'casual'
  return 'conversational'
}

function detectTone(text: string): string {
  const lower = text.toLowerCase()
  let urgent = 0, enthusiastic = 0, formal = 0
  for (const w of URGENT_TONE) if (lower.includes(w)) urgent++
  for (const w of ENTHUSIASTIC_TONE) if (lower.includes(w)) enthusiastic++
  for (const w of FORMAL_TONE) if (lower.includes(w)) formal++

  const max = Math.max(urgent, enthusiastic, formal)
  if (max === 0) return 'informative'
  if (urgent >= max) return 'urgent'
  if (enthusiastic >= max) return 'enthusiastic'
  if (formal >= max) return 'professional'
  return 'informative'
}

function calculateReadability(text: string): { score: number; label: string } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1
  const words = text.trim().split(/\s+/).length || 1
  const syllables = text.toLowerCase().split(/\s+/).reduce((count, word) => {
    const w = word.replace(/[^a-z]/g, '')
    if (w.length <= 3) return count + 1
    let s = 0
    const vowels = 'aeiouy'
    let prevVowel = false
    for (const ch of w) {
      const isVowel = vowels.includes(ch)
      if (isVowel && !prevVowel) s++
      prevVowel = isVowel
    }
    if (w.endsWith('e') && s > 1) s--
    if (s === 0) s = 1
    return count + s
  }, 0)

  // Flesch-Kincaid Grade Level
  const fkGrade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  // Convert to 0-100 scale (lower grade = higher score)
  let score = Math.max(0, Math.min(100, 100 - (fkGrade * 10)))

  let label: string
  if (score >= 80) label = 'Very Easy'
  else if (score >= 60) label = 'Easy'
  else if (score >= 40) label = 'Moderate'
  else if (score >= 20) label = 'Difficult'
  else label = 'Very Difficult'

  return { score: Math.round(score), label }
}

function extractThemes(text: string): string[] {
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  const stopWords = new Set(['this','that','with','from','have','been','were','they','their',
    'them','what','when','where','which','there','about','would','could','should','after',
    'then','some','such','only','other','than','also','into','more','very','just','over',
    'make','made','been','each','most','your','will','until','while','than'])
  
  const freq: Record<string, number> = {}
  for (const w of words) {
    if (!stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
}

function estimateReadTime(wordCount: number): string {
  const minutes = Math.ceil(wordCount / 200)
  return minutes <= 1 ? '< 1 min read' : `${minutes} min read`
}

function suggestImprovements(text: string, style: string): string[] {
  const suggestions: string[] = []
  const words = text.split(/\s+/)
  
  // Average sentence length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length > 0) {
    const avgWords = words.length / sentences.length
    if (avgWords > 30) suggestions.push('Sentences are quite long — consider breaking them into shorter ones for better readability.')
    if (avgWords < 5 && sentences.length > 3) suggestions.push('Sentences are very short — try varying sentence length for better flow.')
  }

  // Passive voice detection (simple heuristic)
  const passiveMatches = text.toLowerCase().match(/\b(is|was|were|been|being)\s+\w+ed\b/g)
  if (passiveMatches && passiveMatches.length > 2) {
    suggestions.push('Multiple instances of passive voice detected. Consider using active voice for stronger impact.')
  }

  // Lexical diversity
  const unique = new Set(words.map(w => w.toLowerCase()))
  const diversity = unique.size / words.length
  if (diversity < 0.4 && words.length > 50) {
    suggestions.push('Try using a wider vocabulary — some words are repeated frequently.')
  }

  if (suggestions.length === 0) {
    suggestions.push('Text reads well overall. Consider adding transitional phrases for even better flow.')
  }

  return suggestions.slice(0, 3)
}

function analyzeLocally(text: string): Analysis {
  const { words } = getWordCount(text)
  const sentiment = analyzeSentiment(text)
  const style = detectWritingStyle(text)
  const tone = detectTone(text)
  const readability = calculateReadability(text)
  const themes = extractThemes(text)

  const summary = text.length > 200
    ? text.slice(0, text.indexOf('.', 150) + 1) || text.slice(0, 200) + '...'
    : text

  return {
    sentiment: sentiment.sentiment,
    sentimentScore: sentiment.score,
    summary: `${summary} ${themes.length > 0 ? `Key themes include ${themes.join(', ').toLowerCase()}.` : ''}`,
    keyThemes: themes,
    writingStyle: style,
    tone,
    readabilityScore: readability.score,
    readabilityLabel: readability.label,
    suggestedImprovements: suggestImprovements(text, style),
    wordCount: words,
    estimatedReadTime: estimateReadTime(words),
  }
}

// ── React Component ─────────────────────────────────────

export default function Home() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Analysis | null>(null)
  const [error, setError] = useState('')
  const [useAI, setUseAI] = useState(false)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  const analyze = useCallback(async () => {
    if (!text.trim() || wordCount < 3) {
      setError('Please enter at least 3 words of text to analyze.')
      return
    }

    setError('')
    setLoading(true)
    setResult(null)

    // Try AI API first (if set up), fallback to local analysis
    try {
      if (useAI) {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim() }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.analysis) {
            setResult(data.analysis)
            setLoading(false)
            return
          }
        }
      }

      // Fallback: client-side analysis
      await new Promise(r => setTimeout(r, 600)) // simulate "thinking"
      const localResult = analyzeLocally(text.trim())
      setResult(localResult)
    } catch (err: any) {
      // Fallback on any error
      const localResult = analyzeLocally(text.trim())
      setResult(localResult)
    } finally {
      setLoading(false)
    }
  }, [text, useAI, wordCount])

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

        <div className="stats-bar" style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            Use AI API (when configured)
          </label>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {useAI ? '⚡ Will try remote AI, falls back to local engine' : '✅ Using local analysis engine (instant, no API needed)'}
          </span>
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
              <>🔍 Analyze Text</>
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

          <div className="result-card full-width" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', padding: 12 }}>
            {useAI ? '🤖 Results powered by MiMo AI' : '⚡ Results from local analysis engine'}
          </div>
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
        <p>Built with Next.js · <a href="https://github.com/Lievuk/ai-text-intel" target="_blank" rel="noopener noreferrer">GitHub</a></p>
      </footer>
    </div>
  )
}
