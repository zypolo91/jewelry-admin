/**
 * 爬虫管理器
 * 统一管理和调度所有爬虫
 */

import { BaseCrawler, CrawlResult, CrawlerRegistry } from './base-crawler';
import { db } from '../../db';
import { certInstitutions, certKnowledge } from '../../db/schema';
import { eq } from 'drizzle-orm';

class CrawlerManager implements CrawlerRegistry {
  private crawlers: Map<string, BaseCrawler> = new Map();

  register(crawler: BaseCrawler): void {
    this.crawlers.set(crawler.name, crawler);
    console.log(`✓ 注册爬虫: ${crawler.name}`);
  }

  getAll(): BaseCrawler[] {
    return Array.from(this.crawlers.values());
  }

  async run(name?: string): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];

    if (name) {
      const crawler = this.crawlers.get(name);
      if (!crawler) {
        console.error(`未找到爬虫: ${name}`);
        return results;
      }
      console.log(`\n🔷 运行爬虫: ${name}`);
      const result = await crawler.crawl();
      results.push(result);
    } else {
      console.log(`\n🔷 运行所有爬虫 (${this.crawlers.size} 个)`);
      for (const [crawlerName, crawler] of this.crawlers) {
        console.log(`\n  ▶ ${crawlerName}`);
        try {
          const result = await crawler.crawl();
          results.push(result);
        } catch (error: any) {
          results.push({
            success: false,
            data: null,
            error: error.message,
            timestamp: new Date(),
            source: crawlerName
          });
        }
      }
    }

    return results;
  }

  /**
   * 保存机构数据到数据库
   */
  async saveInstitution(data: any): Promise<boolean> {
    try {
      const existing = await db
        .select()
        .from(certInstitutions)
        .where(eq(certInstitutions.code, data.code))
        .limit(1);

      if (existing.length > 0) {
        // 更新现有记录
        await db
          .update(certInstitutions)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(certInstitutions.code, data.code));
        console.log(`  📝 更新机构: ${data.code}`);
      } else {
        // 插入新记录
        await db.insert(certInstitutions).values(data);
        console.log(`  ✅ 新增机构: ${data.code}`);
      }
      return true;
    } catch (error: any) {
      console.error(`  ❌ 保存失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 保存知识数据到数据库
   */
  async saveKnowledge(data: any): Promise<boolean> {
    try {
      await db.insert(certKnowledge).values(data);
      console.log(`  ✅ 新增知识: ${data.title}`);
      return true;
    } catch (error: any) {
      console.error(`  ❌ 保存失败: ${error.message}`);
      return false;
    }
  }
}

// 单例导出
export const crawlerManager = new CrawlerManager();

// CLI入口
async function main() {
  const args = process.argv.slice(2);
  const targetArg = args.find((a) => a.startsWith('--target='));
  const typeArg = args.find((a) => a.startsWith('--type='));

  const target = targetArg?.split('=')[1];
  const type = typeArg?.split('=')[1];

  console.log('🚀 证书数据爬虫管理器');
  console.log('========================');

  // 动态加载爬虫
  // TODO: 自动扫描 institutions/ 目录加载爬虫

  if (type === 'institutions' || !type) {
    console.log('\n📋 机构数据爬虫');
    // 这里会自动加载所有机构爬虫
  }

  if (type === 'knowledge' || !type) {
    console.log('\n📚 知识库爬虫');
    // 这里会自动加载所有知识爬虫
  }

  const results = await crawlerManager.run(target);

  console.log('\n========================');
  console.log('📊 爬取结果汇总:');
  console.log(`  成功: ${results.filter((r) => r.success).length}`);
  console.log(`  失败: ${results.filter((r) => !r.success).length}`);

  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}
