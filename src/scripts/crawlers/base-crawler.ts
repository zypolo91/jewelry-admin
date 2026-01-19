/**
 * 爬虫基类
 * 所有机构爬虫继承此类
 */

export interface CrawlResult {
  success: boolean;
  data: any;
  error?: string;
  timestamp: Date;
  source: string;
}

export interface RateLimitConfig {
  requests: number;
  perSeconds: number;
}

export abstract class BaseCrawler {
  abstract name: string;
  abstract baseUrl: string;

  protected rateLimit: RateLimitConfig = { requests: 5, perSeconds: 60 };
  protected lastRequestTime: number = 0;
  protected requestCount: number = 0;
  protected userAgent = 'JewelryApp/1.0 (Certificate Verification Bot)';

  /**
   * 执行爬取
   */
  abstract crawl(): Promise<CrawlResult>;

  /**
   * 解析HTML/JSON响应
   */
  abstract parse(content: string): any;

  /**
   * 发起HTTP请求（带限流）
   */
  protected async fetch(url: string, options?: RequestInit): Promise<Response> {
    await this.waitForRateLimit();

    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'text/html,application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        ...options?.headers
      }
    });

    this.recordRequest();
    return response;
  }

  /**
   * 等待限流
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.rateLimit.perSeconds * 1000;

    if (this.lastRequestTime < windowStart) {
      this.requestCount = 0;
    }

    if (this.requestCount >= this.rateLimit.requests) {
      const waitTime =
        this.lastRequestTime + this.rateLimit.perSeconds * 1000 - now;
      if (waitTime > 0) {
        console.log(`[${this.name}] 限流等待 ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      this.requestCount = 0;
    }
  }

  /**
   * 记录请求
   */
  private recordRequest(): void {
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * 检查robots.txt
   */
  protected async checkRobotsTxt(): Promise<boolean> {
    try {
      const robotsUrl = new URL('/robots.txt', this.baseUrl).href;
      const response = await fetch(robotsUrl);
      if (response.ok) {
        const content = await response.text();
        // 简单检查是否禁止爬取
        if (content.includes('Disallow: /')) {
          console.log(`[${this.name}] robots.txt 禁止爬取`);
          return false;
        }
      }
      return true;
    } catch {
      return true; // 无robots.txt默认允许
    }
  }

  /**
   * 清洗文本数据
   */
  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();
  }

  /**
   * 提取JSON-LD结构化数据
   */
  protected extractJsonLd(html: string): any[] {
    const results: any[] = [];
    const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      try {
        results.push(JSON.parse(match[1]));
      } catch {
        // 忽略解析错误
      }
    }

    return results;
  }
}

/**
 * 爬虫管理器接口
 */
export interface CrawlerRegistry {
  register(crawler: BaseCrawler): void;
  run(name?: string): Promise<CrawlResult[]>;
  getAll(): BaseCrawler[];
}
