# AI Text Intelligence 🤖

Analyze any text using AI — get instant insights on **sentiment**, **key themes**, **writing style**, **tone**, and **readability**.

🔗 **Live Demo:** [https://ai-text-intel.vercel.app](https://ai-text-intel.vercel.app)

## Features

- **Sentiment Analysis** — detects positive, negative, or neutral tone with confidence score
- **Key Themes Extraction** — identifies the main topics and concepts
- **Writing Style Detection** — classifies as formal, casual, technical, creative, persuasive, or conversational
- **Tone Analysis** — identifies the emotional tone (professional, friendly, urgent, humorous, serious, etc.)
- **Readability Scoring** — measures how easy or difficult the text is to read
- **Smart Summary** — generates a concise 2-3 sentence summary
- **Improvement Suggestions** — actionable tips to enhance your writing

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, pure CSS
- **Backend:** Edge API Routes
- **AI:** Powered by MiMo AI API

## Getting Started

```bash
# Clone
git clone https://github.com/Lievuk/ai-text-intel.git
cd ai-text-intel

# Install
npm install

# Run dev
npm run dev

# Build
npm run build
```

## Environment Variables

Create a `.env.local` file:

```
MIMO_API_KEY=your_api_key_here
API_BASE_URL=https://rhanqtm.abc-tunnel.us/v1
MODEL=kr/claude-opus-4.7
```

## Deployment

Deployed on Vercel:

```bash
npm i -g vercel
vercel deploy --prod --yes
```

## Use Cases

- ✍️ **Writers** — improve clarity and tone before publishing
- 📧 **Email Marketers** — analyze campaign copy effectiveness
- 🎓 **Students** — check essay readability and tone
- 💼 **Professionals** — polish business communications

---

Built by [Lievuk](https://github.com/Lievuk) · Powered by MiMo 100T Token Creator Incentive
