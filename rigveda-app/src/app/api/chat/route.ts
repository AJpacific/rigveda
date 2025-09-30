import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const query: string | undefined = body?.query;
    const clientMessages: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(body?.messages) ? body.messages : [];

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });
    }

    const model = process.env.OPENROUTER_MODEL || 'x-ai/grok-4-fast:free';
    const referer = process.env.OPENROUTER_SITE_URL || undefined;
    const title = process.env.OPENROUTER_SITE_NAME || undefined;

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

    let upstreamText = '';
    let upstreamJson: any = null;
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(referer ? { 'HTTP-Referer': referer } : {}),
        ...(title ? { 'X-Title': title } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    }).catch((e) => ({ ok: false, status: 500, text: async () => String(e) } as any));

    try {
      upstreamText = await (resp as Response).text();
      upstreamJson = upstreamText ? JSON.parse(upstreamText) : null;
    } catch {
      upstreamJson = null;
    }

    if (!resp || !(resp as Response).ok) {
      return NextResponse.json({ error: 'LLM error', detail: upstreamText || 'empty response' }, { status: 500 });
    }

    const answer: string = upstreamJson?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ answer, refs: [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Unexpected error', detail: message }, { status: 500 });
  }
}
