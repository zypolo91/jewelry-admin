// 测试OpenRouter API连接
const https = require('https');
const fs = require('fs');

const apiKey =
  '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';

const data = JSON.stringify({
  model: 'google/gemini-2.5-flash-preview',
  messages: [{ role: 'user', content: '你好，请用一句话介绍自己。' }],
  max_tokens: 100
});

const options = {
  hostname: 'openrouter.ai',
  port: 443,
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://hebaobao.jewelry',
    'X-Title': '何宝宝的百宝箱'
  }
};

console.log('Testing OpenRouter API...');

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    fs.writeFileSync('test-result.json', body);
    console.log('Result saved to test-result.json');
    try {
      const json = JSON.parse(body);
      console.log('Model:', json.model);
      console.log('Response:', json.choices?.[0]?.message?.content);
      console.log('Usage:', JSON.stringify(json.usage));
    } catch (e) {
      console.log('Raw response:', body);
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
