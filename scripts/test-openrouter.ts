import { openRouterAIService } from '../src/service/openrouter-ai.service';

async function main() {
  console.log('Testing OpenRouter API connection...');

  // 设置环境变量
  process.env.OPENROUTER_API_KEY =
    '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';

  try {
    const result = await openRouterAIService.testConnection();
    console.log('Test Result:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Test failed:', error.message);
  }
}

main();
