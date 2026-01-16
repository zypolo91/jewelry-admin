// Simple OpenRouter API test using ESM
const apiKey =
  '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';

const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://hebaobao.jewelry',
    'X-Title': 'Test'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash-preview',
    messages: [{ role: 'user', content: 'Hello, say hi in one sentence.' }],
    max_tokens: 100
  })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Data:', JSON.stringify(data, null, 2));
