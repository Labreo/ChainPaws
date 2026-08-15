import { NextRequest, NextResponse } from 'next/server';

// In-memory serverless cache for fast repeated queries
const translationCache = new Map<string, string>();

export async function POST(req: NextRequest) {
  let text = '';
  let targetLang = 'en';

  try {
    const body = await req.json();
    text = body.text || '';
    targetLang = body.targetLang || 'en';

    if (!text || !targetLang || targetLang === 'en') {
      return NextResponse.json({ translatedText: text, source: 'original' });
    }

    const cacheKey = `${targetLang}:${text.trim()}`;
    if (translationCache.has(cacheKey)) {
      return NextResponse.json({
        translatedText: translationCache.get(cacheKey),
        source: 'cache',
      });
    }

    // 1. If Gemini API Key is configured in environment, use Gemini AI
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (geminiKey) {
      try {
        const langNames: Record<string, string> = {
          es: 'Spanish',
          fr: 'French',
          zh: 'Simplified Chinese',
          ja: 'Japanese',
        };
        const langName = langNames[targetLang] || targetLang;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Translate this lost pet description accurately and naturally into ${langName}. Preserve tone and urgency. Return ONLY the translated text without quotes or explanations:\n\n"${text}"`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const translated = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated) {
            translationCache.set(cacheKey, translated);
            return NextResponse.json({ translatedText: translated, source: 'gemini-ai' });
          }
        }
      } catch (aiErr) {
        console.warn('Gemini translation fallback:', aiErr);
      }
    }

    // 2. High-speed zero-config dynamic Google Translate engine
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (ChainPaws Pet Recovery)',
      },
    });

    if (!response.ok) {
      throw new Error(`Translation upstream error: ${response.status}`);
    }

    const data = await response.json();
    let translated = '';

    if (Array.isArray(data?.[0])) {
      translated = data[0].map((item: unknown[]) => (Array.isArray(item) ? item[0] : '')).join('');
    }

    if (translated) {
      translationCache.set(cacheKey, translated);
      return NextResponse.json({ translatedText: translated, source: 'google-ai-engine' });
    }

    return NextResponse.json({ translatedText: text, source: 'fallback' });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', translatedText: text },
      { status: 200 } // Gracefully return original text
    );
  }
}
