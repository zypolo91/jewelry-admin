/**
 * GIA官网数据爬虫
 * 爬取GIA教育资源和证书说明
 */

import { BaseCrawler, CrawlResult } from '../base-crawler';
import { crawlerManager } from '../crawler-manager';

export class GiaCrawler extends BaseCrawler {
  name = 'gia';
  baseUrl = 'https://www.gia.edu';

  // GIA限流更严格
  protected rateLimit = { requests: 3, perSeconds: 60 };

  async crawl(): Promise<CrawlResult> {
    const allowed = await this.checkRobotsTxt();
    if (!allowed) {
      return {
        success: false,
        data: null,
        error: 'robots.txt禁止爬取',
        timestamp: new Date(),
        source: this.name
      };
    }

    try {
      // 爬取教育页面
      const educationData = await this.crawlEducation();

      // 爬取证书说明页面
      const reportData = await this.crawlReportInfo();

      const data = {
        code: 'GIA',
        name: 'GIA',
        fullName: 'Gemological Institute of America',
        country: '美国',
        region: 'international',
        website: this.baseUrl,
        verifyUrl: 'https://www.gia.edu/report-check-landing',
        description: educationData.description || '',
        features: educationData.features || [],
        certTypes: reportData.certTypes || [],
        authority: 10,
        updatedAt: new Date()
      };

      // 保存到数据库
      await crawlerManager.saveInstitution(data);

      return {
        success: true,
        data,
        timestamp: new Date(),
        source: this.name
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message,
        timestamp: new Date(),
        source: this.name
      };
    }
  }

  /**
   * 爬取教育资源页面
   */
  private async crawlEducation(): Promise<any> {
    try {
      const url = `${this.baseUrl}/gem-education`;
      const response = await this.fetch(url);
      const html = await response.text();

      return this.parseEducation(html);
    } catch {
      return { description: '', features: [] };
    }
  }

  /**
   * 爬取证书报告说明
   */
  private async crawlReportInfo(): Promise<any> {
    try {
      const url = `${this.baseUrl}/gem-lab-service/report-services`;
      const response = await this.fetch(url);
      const html = await response.text();

      return this.parseReportInfo(html);
    } catch {
      return { certTypes: [] };
    }
  }

  parse(content: string): any {
    // 通用解析
    const jsonLd = this.extractJsonLd(content);
    return { jsonLd };
  }

  /**
   * 解析教育页面
   */
  private parseEducation(html: string): any {
    const features: any[] = [];

    // 提取特征（简化实现，实际需用cheerio等库）
    if (html.includes('4Cs')) {
      features.push({
        name: '4C标准创始者',
        description: '发明并推广钻石4C分级系统'
      });
    }

    if (html.includes('globally recognized')) {
      features.push({
        name: '全球认可',
        description: '证书在全球范围内被广泛认可'
      });
    }

    // 提取结构化数据
    const jsonLd = this.extractJsonLd(html);
    const orgData = jsonLd.find((j: any) => j['@type'] === 'Organization');

    return {
      description:
        orgData?.description || 'GIA是全球最权威的宝石学研究和教育机构',
      features
    };
  }

  /**
   * 解析证书类型页面
   */
  private parseReportInfo(html: string): any {
    const certTypes: any[] = [];

    // 简化实现
    const defaultTypes = [
      {
        code: 'diamond',
        name: '钻石分级报告',
        description: '详细的钻石4C分级'
      },
      {
        code: 'diamond-dossier',
        name: '钻石简报',
        description: '简化版钻石报告'
      },
      {
        code: 'colored-stone',
        name: '彩色宝石报告',
        description: '彩色宝石鉴定'
      },
      { code: 'pearl', name: '珍珠分级报告', description: '珍珠品质评估' }
    ];

    return { certTypes: defaultTypes };
  }
}

// 注册爬虫
crawlerManager.register(new GiaCrawler());
