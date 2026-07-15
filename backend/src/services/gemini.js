// Gemini free-tier client. If GEMINI_API_KEY is missing or every model fails,
// callers receive { fallback: true } and show a canned message — the demo
// must never break because of the AI layer.

// Tried in order: Google retires model versions and free-tier quotas shift,
// so a single hardcoded model is fragile. GEMINI_MODEL (if set) is tried first.
const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
].filter(Boolean);

export function aiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generate(prompt) {
  if (!aiEnabled()) return { fallback: true, text: null };

  const { GoogleGenAI } = await import('@google/genai');
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  for (const model of MODELS) {
    try {
      const result = await client.models.generateContent({ model, contents: prompt });
      if (result.text) return { fallback: false, text: result.text };
    } catch (err) {
      console.error(`Gemini call failed (${model}):`, err.message?.slice(0, 200));
    }
  }
  return { fallback: true, text: null };
}
