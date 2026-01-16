import { NextRequest, NextResponse } from 'next/server';

// 简单测试OpenRouter API连接
export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      message: 'OPENROUTER_API_KEY not configured',
      env: Object.keys(process.env).filter(
        (k) => k.includes('OPENROUTER') || k.includes('AI')
      )
    });
  }

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://hebaobao.jewelry',
          'X-Title': 'Test'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-preview',
          messages: [
            { role: 'user', content: 'Hello, say hi in one sentence.' }
          ],
          max_tokens: 100
        })
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      model: data.model,
      response: data.choices?.[0]?.message?.content,
      usage: data.usage,
      error: data.error,
      rawResponse: data
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
