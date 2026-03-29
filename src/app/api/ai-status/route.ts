/**
 * AI Status API — v9.7.11
 * GET: Returns the current AI configuration status
 *
 * Used by frontend to display whether AI features are active or in template/demo mode.
 * v9.7.11: Updated for Gemini 2.5 Flash (paid tier 1)
 * v9.7.4: Added key prefix diagnostic, env source tracking, and test call option
 */
import { NextResponse } from 'next/server';
import { requireAuth, apiHandler } from '@/lib/middleware';
import { getAIStatus, hasApiKey, callGemini } from '@/lib/ai';

export const GET = apiHandler(async (req: Request) => {
  await requireAuth();

  const status = getAIStatus();
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

  // Add diagnostic info (safe — never expose full key)
  const diagnostic = {
    ...status,
    keyPrefix: key ? key.substring(0, 8) + '...' : '(none)',
    keyLength: key.length,
    keySource: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 'none',
    hasApiKeyResult: hasApiKey(),
    version: '9.7.11',
  };

  // Optional: test the actual API connection with ?test=true
  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === 'true' && hasApiKey()) {
    try {
      const response = await callGemini('Say "AI is active" in exactly 3 words.', { temperature: 0, maxTokens: 20 });
      return NextResponse.json({
        ...diagnostic,
        testResult: 'success',
        testResponse: response.substring(0, 100),
      });
    } catch (e) {
      return NextResponse.json({
        ...diagnostic,
        testResult: 'failed',
        testError: (e as Error).message.substring(0, 200),
      });
    }
  }

  return NextResponse.json(diagnostic);
});
