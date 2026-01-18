/**
 * OpenRouter AI服务 - 使用Gemini 2.5 Flash模型
 * 用于AI设计功能
 * API文档: https://openrouter.ai/docs/quickstart
 */

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenRouterContentPart[];
}

interface OpenRouterContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenRouterChatResponse {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DesignResult {
  designDescription: string;
  styleAnalysis: {
    style: string;
    elements: string[];
    colorPalette: string[];
    materials: string[];
  };
  suggestions: string[];
  inspirations: string[];
  technicalNotes: string;
}

class OpenRouterAIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'google/gemini-2.5-flash-preview';
  }

  /**
   * 发送聊天请求
   */
  private async sendRequest(
    messages: OpenRouterMessage[],
    maxTokens: number = 4096
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API Key未配置');
    }

    const requestBody: OpenRouterChatRequest = {
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: false
    };

    console.log(
      'OpenRouter Request:',
      JSON.stringify({
        model: this.model,
        messageCount: messages.length,
        hasImages: messages.some(
          (m) =>
            Array.isArray(m.content) &&
            m.content.some((c) => c.type === 'image_url')
        )
      })
    );

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://hebaobao.jewelry',
        'X-Title': 'Hebaobao Jewelry Box'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', response.status, errorText);
      throw new Error(`OpenRouter API错误: ${response.status} - ${errorText}`);
    }

    const data: OpenRouterChatResponse = await response.json();
    console.log(
      'OpenRouter Response:',
      JSON.stringify({
        id: data.id,
        model: data.model,
        usage: data.usage,
        finishReason: data.choices[0]?.finish_reason
      })
    );

    if (!data.choices || data.choices.length === 0) {
      throw new Error('OpenRouter返回空响应');
    }

    return data.choices[0].message.content;
  }

  /**
   * AI珠宝设计 - 根据图片和提示词生成设计方案，支持纯文字设计
   */
  async design(imageBase64?: string, prompt?: string): Promise<DesignResult> {
    const systemPrompt = `你是一位专业的珠宝设计师和艺术顾问。用户可能提供珠宝图片和/或设计需求，你需要：
1. 如果有图片：分析图片中的珠宝风格、材质、工艺
2. 根据用户需求提供专业的设计建议
3. 给出具体的设计方案和灵感来源
4. 如果只有文字描述：基于描述创造性地设计珠宝方案

请用JSON格式返回结果，包含以下字段：
{
  "designDescription": "详细的设计描述（200-500字）",
  "styleAnalysis": {
    "style": "设计风格（如：现代简约、复古宫廷、民族风情等）",
    "elements": ["设计元素1", "设计元素2", ...],
    "colorPalette": ["主色调1", "主色调2", ...],
    "materials": ["建议材质1", "建议材质2", ...]
  },
  "suggestions": ["设计建议1", "设计建议2", ...],
  "inspirations": ["灵感来源1", "灵感来源2", ...],
  "technicalNotes": "工艺技术说明"
}

注意：
- 设计描述要详细、专业、有创意
- 建议要具体可行
- 支持纯文字创意设计`;

    const userContent: OpenRouterContentPart[] = [];

    // 如果有图片，添加图片内容
    if (imageBase64) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imageBase64.startsWith('data:')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`
        }
      });
    }

    // 添加文字内容
    userContent.push({
      type: 'text',
      text:
        prompt ||
        (imageBase64
          ? '请分析这张珠宝图片，并给出设计建议和改进方案。'
          : '请为我设计一款珠宝，给出创意设计方案。')
    });

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];

    const response = await this.sendRequest(messages, 4096);

    try {
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as DesignResult;
        return result;
      }

      // 如果无法解析JSON，返回默认结构
      return {
        designDescription: response,
        styleAnalysis: {
          style: '待分析',
          elements: [],
          colorPalette: [],
          materials: []
        },
        suggestions: [],
        inspirations: [],
        technicalNotes: ''
      };
    } catch (parseError) {
      console.error('解析设计结果失败:', parseError);
      return {
        designDescription: response,
        styleAnalysis: {
          style: '待分析',
          elements: [],
          colorPalette: [],
          materials: []
        },
        suggestions: [],
        inspirations: [],
        technicalNotes: ''
      };
    }
  }

  /**
   * AI设计对话 - 纯文本设计咨询
   */
  async designChat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    const systemPrompt = `你是一位专业的珠宝设计师和艺术顾问，名叫"宝宝设计师"。
你精通各种珠宝设计风格，包括但不限于：
- 现代简约风格
- 复古宫廷风格
- 民族风情风格
- 自然灵感风格
- 几何艺术风格

你可以帮助用户：
1. 分析珠宝设计趋势
2. 提供个性化设计建议
3. 解答珠宝工艺问题
4. 推荐搭配方案

请用专业但友好的语气回答用户问题。`;

    const openRouterMessages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ];

    return await this.sendRequest(openRouterMessages, 2048);
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    model: string;
  }> {
    try {
      const messages: OpenRouterMessage[] = [
        { role: 'user', content: '你好，请简单介绍一下你自己。' }
      ];

      const response = await this.sendRequest(messages, 100);
      return {
        success: true,
        message: response.substring(0, 100),
        model: this.model
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        model: this.model
      };
    }
  }
}

export const openRouterAIService = new OpenRouterAIService();
