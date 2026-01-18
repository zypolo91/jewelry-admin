# 证书机构数据爬虫扩展方案

## 架构概述

```
crawlers/
├── README.md              # 本文档
├── base-crawler.ts        # 爬虫基类
├── crawler-manager.ts     # 爬虫管理器
├── institutions/          # 机构数据爬虫
│   ├── gia-crawler.ts
│   ├── ngtc-crawler.ts
│   └── ...
├── knowledge/             # 知识库爬虫
│   └── gem-knowledge.ts
└── utils/
    ├── proxy-pool.ts      # 代理池
    ├── rate-limiter.ts    # 请求限流
    └── data-cleaner.ts    # 数据清洗
```

## 数据来源

### 机构官方网站

| 机构 | 数据URL        | 可爬取内容                       |
| ---- | -------------- | -------------------------------- |
| GIA  | gia.edu        | 证书格式说明、4C标准、教育资源   |
| NGTC | ngtc.com.cn    | 证书查询说明、检测标准、机构介绍 |
| IGI  | igi.org        | 证书类型、验证方法               |
| HRD  | hrdantwerp.com | 分级标准、证书说明               |

### 知识库来源

- 珠宝百科网站
- 行业协会发布的标准文档
- 机构官方教育资源

## 爬虫策略

### 1. 请求限流

```typescript
// 每个域名限制请求频率
const rateLimits = {
  'gia.edu': { requests: 10, per: '1m' },
  'ngtc.com.cn': { requests: 5, per: '1m' },
  default: { requests: 3, per: '1m' }
};
```

### 2. 增量更新

- 使用ETag/Last-Modified检测变化
- 记录上次爬取时间
- 只更新变化的数据

### 3. 数据验证

- 必填字段检查
- 格式验证
- 去重处理

## 法律合规

### robots.txt遵守

- 自动解析并遵守robots.txt规则
- 尊重Crawl-delay设置

### 数据使用

- 仅用于用户验证证书真伪
- 不存储受版权保护的图片
- 链接回原始来源

## 部署方式

### 定时任务

```bash
# 每周更新机构数据
0 3 * * 0 npx tsx src/scripts/crawlers/crawler-manager.ts --type=institutions

# 每月更新知识库
0 4 1 * * npx tsx src/scripts/crawlers/crawler-manager.ts --type=knowledge
```

### 手动触发

```bash
npx tsx src/scripts/crawlers/crawler-manager.ts --target=GIA
```

## 扩展新机构

1. 在`institutions/`下创建新爬虫
2. 继承`BaseCrawler`类
3. 实现`crawl()`和`parse()`方法
4. 注册到`crawler-manager.ts`

```typescript
export class NewInstitutionCrawler extends BaseCrawler {
  name = 'new-institution';
  baseUrl = 'https://...';

  async crawl() { ... }
  async parse(html: string) { ... }
}
```
