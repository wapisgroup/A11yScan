import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_HTML_LENGTH = 1200;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || 'gpt-4.1-mini';

    if (!apiKey) {
      return NextResponse.json({ message: 'AI_API_KEY not configured' }, { status: 400 });
    }

    const body = await request.json();
    const issue = body?.issue || null;

    if (!issue || !issue.message) {
      return NextResponse.json({ message: 'Missing issue data' }, { status: 400 });
    }

    const htmlSnippet = issue.html ? String(issue.html).slice(0, MAX_HTML_LENGTH) : '';

    const systemText = [
      'You are an accessibility expert.',
      'Return only valid JSON with shape: {"howToFix": "...", "confidence": 0.7}.',
      'Provide concise steps. If HTML is provided, include an updated code snippet in markdown.',
      'If unsure, return an empty howToFix and confidence 0.0.'
    ].join(' ');

    const userPayload = {
      message: issue.message,
      ruleId: issue.ruleId || null,
      engine: issue.engine || null,
      selector: issue.selector || null,
      html: htmlSnippet,
      tags: issue.tags || [],
      evidence: issue.evidence || []
    };

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemText }] },
          { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(userPayload) }] }
        ],
        text: { format: { type: 'json_object' } }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { message: `AI API failed: ${res.status} - ${errorText}` },
        { status: 502 }
      );
    }

    const response = await res.json();
    const howToFix = extractHowToFix(response);

    return NextResponse.json({ howToFix }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message }, { status: 500 });
  }
}

function extractHowToFix(response: any): string {
  const output = response?.output || [];
  for (const item of output) {
    const content = item?.content || [];
    for (const block of content) {
      if (block?.type === 'output_text' && block?.text) {
        try {
          const parsed = JSON.parse(block.text);
          return typeof parsed.howToFix === 'string' ? parsed.howToFix : '';
        } catch (err) {
          return '';
        }
      }
    }
  }
  return '';
}
