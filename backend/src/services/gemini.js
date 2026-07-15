// Gemini free-tier client. If GEMINI_API_KEY is missing or the call fails,
// callers receive { fallback: true } and show a canned message — the demo
// must never break because of the AI layer.

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export function aiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generate(prompt) {
  if (!aiEnabled()) return { fallback: true, text: null };

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return { fallback: false, text: result.text };
  } catch (err) {
    console.error('Gemini call failed:', err.message);
    return { fallback: true, text: null };
  }
}
