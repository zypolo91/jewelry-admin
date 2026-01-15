/**
 * 智谱AI服务 - 使用GLM-4.5-flash模型
 * API文档: https://docs.bigmodel.cn/api-reference/
 */

interface ZhipuMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ZhipuContentPart[];
}

interface ZhipuContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface ZhipuChatRequest {
  model: string;
  messages: ZhipuMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ZhipuChatResponse {
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

export interface ValuationResult {
  category: string;
  material: string;
  qualityScore: number;
  estimatedRange: {
    min: number;
    max: number;
  };
  confidence: number;
  analysis: {
    color: { score: number; description: string };
    clarity: { score: number; description: string };
    craftsmanship: { score: number; description: string };
    rarity: { score: number; description: string };
  };
  marketReference: {
    avgPrice: number;
    priceRange: string;
    trend: string;
  };
  suggestions: string;
}

export interface AuthenticationResult {
  result: 'authentic' | 'suspicious' | 'fake';
  confidence: number;
  issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    location?: string;
  }>;
  suggestions: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class ZhipuAIService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private visionModel: string;

  constructor() {
    this.apiKey = process.env.ZHIPU_API_KEY || '';
    this.apiUrl =
      process.env.ZHIPU_API_URL ||
      'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    this.model = process.env.ZHIPU_MODEL || 'glm-4-flash';
    this.visionModel = process.env.ZHIPU_VISION_MODEL || 'glm-4v-flash';
  }

  private async callAPI(request: ZhipuChatRequest): Promise<ZhipuChatResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`智谱AI API调用失败: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * AI智能估价
   */
  async getValuation(imageUrl: string): Promise<ValuationResult> {
    const systemPrompt = `你是一位专业的珠宝鉴定师和估价师，拥有20年以上的珠宝鉴定经验。
请分析图片中的珠宝，提供详细的估价报告。

你需要返回一个严格的JSON格式，包含以下字段：
{
  "category": "珠宝类型，如：翡翠、和田玉、松石、蜜蜡、珍珠等",
  "material": "材质描述",
  "qualityScore": 0.0-1.0之间的品质评分,
  "estimatedRange": {
    "min": 最低估价（人民币）,
    "max": 最高估价（人民币）
  },
  "confidence": 0.0-1.0之间的置信度,
  "analysis": {
    "color": { "score": 0.0-1.0, "description": "颜色评价" },
    "clarity": { "score": 0.0-1.0, "description": "透明度/净度评价" },
    "craftsmanship": { "score": 0.0-1.0, "description": "工艺评价" },
    "rarity": { "score": 0.0-1.0, "description": "稀有度评价" }
  },
  "marketReference": {
    "avgPrice": 市场均价,
    "priceRange": "价格区间描述",
    "trend": "市场趋势描述"
  },
  "suggestions": "收藏建议"
}

注意：
1. 只返回JSON，不要有其他文字
2. 估价要基于当前市场行情
3. 如果无法识别，请给出合理的估计并降低置信度`;

    const messages: ZhipuMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请分析这张珠宝图片并给出估价报告：' },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ];

    const response = await this.callAPI({
      model: this.visionModel,
      messages,
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '';

    try {
      // 尝试提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法解析AI返回的JSON');
    } catch (e) {
      // 返回默认结果
      return {
        category: '未知',
        material: '未知',
        qualityScore: 0.5,
        estimatedRange: { min: 0, max: 0 },
        confidence: 0.3,
        analysis: {
          color: { score: 0.5, description: '无法评估' },
          clarity: { score: 0.5, description: '无法评估' },
          craftsmanship: { score: 0.5, description: '无法评估' },
          rarity: { score: 0.5, description: '无法评估' }
        },
        marketReference: {
          avgPrice: 0,
          priceRange: '无法估计',
          trend: '无法判断'
        },
        suggestions: '建议提供更清晰的图片以获得准确估价'
      };
    }
  }

  /**
   * AI鉴定助手
   */
  async authenticate(imageUrls: string[]): Promise<AuthenticationResult> {
    const systemPrompt = `你是一位专业的珠宝鉴定专家，擅长识别珠宝真伪。
请分析图片中的珠宝，判断其真伪并指出可能的问题。

你需要返回一个严格的JSON格式：
{
  "result": "authentic" | "suspicious" | "fake",
  "confidence": 0.0-1.0之间的置信度,
  "issues": [
    {
      "type": "问题类型，如：颜色异常、纹理不自然、工艺粗糙等",
      "description": "详细描述",
      "severity": "low" | "medium" | "high",
      "location": "问题位置（可选）"
    }
  ],
  "suggestions": "鉴定建议，是否需要送专业机构检测等"
}

注意：
1. 只返回JSON，不要有其他文字
2. 谨慎判断，如果不确定请标记为suspicious
3. 详细说明发现的问题`;

    const imageContents: ZhipuContentPart[] = [
      { type: 'text', text: '请鉴定以下珠宝图片的真伪：' }
    ];

    imageUrls.forEach((url, index) => {
      imageContents.push({ type: 'image_url', image_url: { url } });
    });

    const messages: ZhipuMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: imageContents }
    ];

    const response = await this.callAPI({
      model: this.visionModel,
      messages,
      temperature: 0.2,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法解析AI返回的JSON');
    } catch (e) {
      return {
        result: 'suspicious',
        confidence: 0.3,
        issues: [
          {
            type: '无法判断',
            description: '图片质量不足或无法识别',
            severity: 'medium'
          }
        ],
        suggestions: '建议提供更清晰的图片或送专业机构鉴定'
      };
    }
  }

  /**
   * AI知识问答
   */
  async chat(messages: ChatMessage[], sessionId?: string): Promise<string> {
    const systemPrompt = `你是一位专业的珠宝顾问，拥有丰富的珠宝知识和收藏经验。
你可以回答关于：
1. 珠宝保养知识 - 不同材质珠宝的保养方法
2. 购买注意事项 - 如何挑选、鉴别珠宝
3. 市场行情解读 - 各类珠宝的价格走势
4. 收藏投资建议 - 哪些珠宝值得收藏

请用专业但易懂的语言回答用户问题，必要时可以给出具体建议。`;

    const zhipuMessages: ZhipuMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ];

    const response = await this.callAPI({
      model: this.model,
      messages: zhipuMessages,
      temperature: 0.7,
      max_tokens: 2000
    });

    return (
      response.choices[0]?.message?.content || '抱歉，我无法回答这个问题。'
    );
  }

  /**
   * 生成估价报告
   */
  async generateValuationReport(
    valuation: ValuationResult,
    jewelryName: string
  ): Promise<string> {
    const prompt = `请根据以下估价数据，生成一份专业的珠宝估价报告：

珠宝名称：${jewelryName}
类型：${valuation.category}
材质：${valuation.material}
品质评分：${valuation.qualityScore}
估价范围：¥${valuation.estimatedRange.min} - ¥${valuation.estimatedRange.max}

详细分析：
- 颜色：${valuation.analysis.color.description}（评分：${valuation.analysis.color.score}）
- 净度：${valuation.analysis.clarity.description}（评分：${valuation.analysis.clarity.score}）
- 工艺：${valuation.analysis.craftsmanship.description}（评分：${valuation.analysis.craftsmanship.score}）
- 稀有度：${valuation.analysis.rarity.description}（评分：${valuation.analysis.rarity.score}）

请生成一份正式的估价报告，包含：
1. 报告标题
2. 珠宝基本信息
3. 品质分析
4. 市场参考
5. 估价结论
6. 免责声明`;

    const response = await this.callAPI({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 3000
    });

    return response.choices[0]?.message?.content || '';
  }
}

export const zhipuAIService = new ZhipuAIService();
