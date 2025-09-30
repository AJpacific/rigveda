import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ClientMessage = { role: 'user' | 'assistant'; content: string };
type OpenRouterChoice = { message?: { content?: string } };
type OpenRouterResponse = { choices?: OpenRouterChoice[] };

function isClientMessage(value: unknown): value is ClientMessage {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { role?: unknown; content?: unknown };
  return (v.role === 'user' || v.role === 'assistant') && typeof v.content === 'string';
}

export async function POST(req: NextRequest) {
  try {
    let parsedBody: unknown;
    try {
      parsedBody = await req.json();
    } catch {
      parsedBody = {};
    }
    const bodyObj = (typeof parsedBody === 'object' && parsedBody !== null)
      ? (parsedBody as Record<string, unknown>)
      : {};
    const query = typeof bodyObj.query === 'string' ? bodyObj.query : undefined;
    const rawMessages = Array.isArray(bodyObj.messages) ? bodyObj.messages : [];
    const clientMessages: ClientMessage[] = rawMessages.filter(isClientMessage);

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });
    }

    const model = process.env.OPENROUTER_MODEL || 'google/gemma-3-27b-it:free';
    const referer = process.env.OPENROUTER_SITE_URL || undefined;
    const title = process.env.OPENROUTER_SITE_NAME || undefined;

    // Derive safe fallbacks for OpenRouter-required headers in hosted environments
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
    const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const originHeader = req.headers.get('origin') || undefined;
    const fallbackReferer = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (originHeader || (forwardedHost ? `${forwardedProto}://${forwardedHost}` : undefined));
    const finalReferer = referer || fallbackReferer;
    const finalTitle = title || 'Rigveda';

    const systemInstruction = 'You are a helpful, concise assistant that ONLY answers questions about the Rigveda. If a question is outside the Rigveda, politely refuse and explain you can only discuss the Rigveda. Avoid speculation and do not fabricate citations.';

    // Extract optional inline CONTEXT from the first user turn
    let extractedContext: string | null = null;
    const normalizedMessages: { role: 'user' | 'assistant'; content: string }[] = [];

    for (let i = 0; i < clientMessages.length; i++) {
      const m = clientMessages[i];
      if (i === 0 && m.role === 'user') {
        const idx = m.content.indexOf('CONTEXT');
        if (idx !== -1) {
          // Expected format: CONTEXT\n...\n\nQUESTION: ...
          const parts = m.content.split(/QUESTION\s*:\s*/i);
          if (parts.length >= 1) {
            const ctxPart = parts[0].replace(/^\s*CONTEXT\s*/i, '').trim();
            if (ctxPart) extractedContext = `Use ONLY this Rigveda verse/context:\n${ctxPart}`;
          }
          const questionText = parts.length > 1 ? parts.slice(1).join('QUESTION:').trim() : '';
          if (questionText) {
            normalizedMessages.push({ role: 'user', content: questionText });
          }
          continue;
        }
      }
      normalizedMessages.push(m);
    }

    if (query) {
      normalizedMessages.push({ role: 'user', content: query });
    }

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemInstruction },
      ...(extractedContext ? [{ role: 'system', content: extractedContext }] : []),
      ...normalizedMessages,
    ];

    let resp: Response;
    try {
      resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(finalReferer ? { 'HTTP-Referer': finalReferer } : {}),
          ...(finalTitle ? { 'X-Title': finalTitle } : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.error('[chat] OpenRouter fetch failed:', detail);
      return NextResponse.json({ error: 'LLM error', detail }, { status: 500 });
    }

    const upstreamText = await resp.text();
    let upstreamJson: OpenRouterResponse | null = null;
    try {
      upstreamJson = upstreamText ? (JSON.parse(upstreamText) as OpenRouterResponse) : null;
    } catch {
      upstreamJson = null;
    }

    if (!resp.ok) {
      const parsedUpstream: unknown = upstreamJson;
      const errorPayload = (parsedUpstream && typeof parsedUpstream === 'object') ? parsedUpstream as Record<string, unknown> : {};
      const upstreamError = (errorPayload as { error?: { message?: string; code?: string | number } }).error;
      const detailMessage = upstreamError?.message || upstreamText || 'empty response';
      const code = upstreamError?.code;
      console.error('[chat] OpenRouter non-OK response:', resp.status, detailMessage);
      return NextResponse.json({ error: 'LLM error', code, detail: detailMessage }, { status: resp.status || 500 });
    }

    const answer: string = upstreamJson?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ answer, refs: [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Unexpected error', detail: message }, { status: 500 });
  }
}
