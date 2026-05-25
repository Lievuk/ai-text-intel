export const runtime = 'edge'

const SYSTEM_PROMPT = `You are an expert text analyst. Analyze the given text and return a JSON response with these exact fields:
{
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": number between 0 and 1,
  "summary": "2-3 sentence summary of the text",
  "keyThemes": ["theme1", "theme2", ...] (up to 5 themes),
  "writingStyle": "formal" | "casual" | "technical" | "creative" | "persuasive" | "conversational",
  "tone": "professional" | "friendly" | "urgent" | "humorous" | "serious" | "enthusiastic" | "informative",
  "readabilityScore": number between 0 and 100,
  "readabilityLabel": "Very Easy" | "Easy" | "Moderate" | "Difficult" | "Very Difficult",
  "suggestedImprovements": ["suggestion1", "suggestion2", ...] (up to 3 suggestions),
  "wordCount": number,
  "estimatedReadTime": "X min read"
}

Respond ONLY with the JSON object, no other text.`

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Text is required' }, { status: 400 })
    }

    if (text.length < 10) {
      return Response.json({ error: 'Text must be at least 10 characters' }, { status: 400 })
    }

    const apiKey = process.env.MIMO_API_KEY || 'sk-195...ba46'
    const baseUrl = process.env.API_BASE_URL || 'https://rhanqtm.abc-tunnel.us/v1'
    const model = process.env.MODEL || 'kr/claude-opus-4.7'

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this text:\n\n"""${text}"""` }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', response.status, errorText)
      return Response.json(
        { error: `AI service returned ${response.status}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return Response.json({ error: 'Empty response from AI service' }, { status: 502 })
    }

    // Parse JSON from the response
    let analysis
    try {
      // Find JSON in the response (handle cases where AI wraps it in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        analysis = JSON.parse(content)
      }
    } catch {
      return Response.json({ error: 'Failed to parse AI response' }, { status: 502 })
    }

    return Response.json({ analysis })
  } catch (err: any) {
    console.error('Analysis error:', err)
    return Response.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
