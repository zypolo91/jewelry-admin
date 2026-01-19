/**
 * 中国珠宝检测机构扩展数据
 * 包含各省市权威检测机构
 */

import { db } from '../db';
import { certInstitutions } from '../db/schema';
import { eq } from 'drizzle-orm';

// 中国省级及重要检测机构
const chinaInstitutions = [
  // ========== 国家级机构 ==========
  {
    code: 'NGTC',
    name: 'NGTC',
    fullName: '国家珠宝玉石质量监督检验中心',
    country: '中国',
    region: 'china',
    website: 'https://www.ngtc.com.cn',
    verifyUrl: 'https://www.ngtc.com.cn/zscx/index.html',
    description: 'NGTC是中国最权威的珠宝玉石检测机构，隶属于自然资源部。',
    features: [
      { name: '国家级', description: '国家质检系统权威机构' },
      { name: '标准制定', description: '制定国家珠宝标准' }
    ],
    certTypes: [
      { code: 'jade', name: '翡翠', price: 50 },
      { code: 'diamond', name: '钻石', price: 100 },
      { code: 'gemstone', name: '彩宝', price: 80 },
      { code: 'gold', name: '贵金属', price: 30 }
    ],
    pricing: [
      { type: '普通鉴定', price: 50, currency: 'CNY', days: 7 },
      { type: '加急鉴定', price: 100, currency: 'CNY', days: 3 },
      { type: '特急鉴定', price: 200, currency: 'CNY', days: 1 }
    ],
    certifications: ['CMA', 'CAL', 'CNAS'],
    branches: [
      {
        city: '北京',
        address: '北京市东城区北三环东路36号',
        phone: '010-84273637'
      },
      {
        city: '上海',
        address: '上海市徐汇区宜山路407号',
        phone: '021-64280968'
      },
      {
        city: '深圳',
        address: '深圳市罗湖区贝丽北路水贝珠宝大厦',
        phone: '0755-25633239'
      }
    ],
    avgProcessingDays: 5,
    authority: 10,
    sortOrder: 1
  },

  // ========== 省级权威机构 ==========
  {
    code: 'GTC',
    name: 'GTC',
    fullName: '广东省珠宝玉石及贵金属检测中心',
    country: '中国',
    region: 'china',
    website: 'https://www.gtc-china.cn',
    verifyUrl: 'https://www.gtc-china.cn/search',
    description: '华南地区最大的珠宝检测机构，服务深圳、广州珠宝产业集群。',
    features: [
      { name: '华南权威', description: '服务珠宝产业集群' },
      { name: '快速出证', description: '提供加急服务' }
    ],
    certTypes: [
      { code: 'jade', name: '翡翠', price: 40 },
      { code: 'diamond', name: '钻石', price: 80 },
      { code: 'gold', name: '贵金属', price: 25 }
    ],
    pricing: [
      { type: '普通', price: 40, currency: 'CNY', days: 5 },
      { type: '加急', price: 80, currency: 'CNY', days: 2 }
    ],
    certifications: ['CMA', 'CAL'],
    branches: [
      {
        city: '广州',
        address: '广州市荔湾区康王中路300号',
        phone: '020-81529192'
      },
      { city: '深圳', address: '深圳市罗湖区田贝四路', phone: '0755-25590026' }
    ],
    avgProcessingDays: 3,
    authority: 8,
    sortOrder: 2
  },
  {
    code: 'SJGTC',
    name: '上海质检',
    fullName: '上海市质量监督检验技术研究院珠宝检测中心',
    country: '中国',
    region: 'china',
    website: 'http://www.sqi.org.cn',
    verifyUrl: 'http://www.sqi.org.cn/zscx',
    description: '上海地区权威珠宝检测机构，服务长三角珠宝市场。',
    features: [{ name: '华东权威', description: '服务长三角地区' }],
    certTypes: [
      { code: 'jade', name: '翡翠和田玉', price: 45 },
      { code: 'diamond', name: '钻石', price: 90 },
      { code: 'pearl', name: '珍珠', price: 35 }
    ],
    pricing: [{ type: '普通', price: 45, currency: 'CNY', days: 5 }],
    certifications: ['CMA', 'CAL'],
    branches: [
      {
        city: '上海',
        address: '上海市虹口区广粤路1288号',
        phone: '021-65422440'
      }
    ],
    avgProcessingDays: 5,
    authority: 8,
    sortOrder: 3
  },
  {
    code: 'ZJGTC',
    name: '浙江质检',
    fullName: '浙江省珠宝玉石首饰鉴定中心',
    country: '中国',
    region: 'china',
    website: 'http://www.zjgold.com',
    verifyUrl: 'http://www.zjgold.com/search',
    description: '浙江省权威检测机构，在珍珠鉴定方面有专长（诸暨珍珠产地）。',
    features: [{ name: '珍珠专家', description: '诸暨珍珠鉴定权威' }],
    certTypes: [
      { code: 'pearl', name: '珍珠', price: 30 },
      { code: 'jade', name: '翡翠', price: 40 }
    ],
    pricing: [{ type: '普通', price: 35, currency: 'CNY', days: 5 }],
    certifications: ['CMA'],
    branches: [
      {
        city: '杭州',
        address: '杭州市下城区体育场路335号',
        phone: '0571-85175718'
      }
    ],
    avgProcessingDays: 5,
    authority: 7,
    sortOrder: 4
  },
  {
    code: 'YNGTC',
    name: '云南质检',
    fullName: '云南省珠宝玉石质量监督检验研究院',
    country: '中国',
    region: 'china',
    website: 'http://www.ynjc.cn',
    verifyUrl: 'http://www.ynjc.cn/search',
    description:
      '云南省权威机构，在翡翠鉴定方面有独特优势（靠近缅甸翡翠产地）。',
    features: [
      { name: '翡翠权威', description: '毗邻翡翠原产地' },
      { name: '边贸专家', description: '服务瑞丽等边贸口岸' }
    ],
    certTypes: [
      { code: 'jade', name: '翡翠', price: 35 },
      { code: 'gemstone', name: '彩色宝石', price: 50 }
    ],
    pricing: [{ type: '普通', price: 35, currency: 'CNY', days: 5 }],
    certifications: ['CMA', 'CAL'],
    branches: [
      {
        city: '昆明',
        address: '昆明市官渡区春城路289号',
        phone: '0871-63635396'
      },
      { city: '瑞丽', address: '瑞丽市姐告边贸区', phone: '0692-4141717' }
    ],
    avgProcessingDays: 4,
    authority: 8,
    sortOrder: 5
  },
  {
    code: 'XJGTC',
    name: '新疆质检',
    fullName: '新疆维吾尔自治区产品质量监督检验研究院珠宝中心',
    country: '中国',
    region: 'china',
    website: 'http://www.xjzj.gov.cn',
    verifyUrl: '',
    description: '新疆地区权威机构，在和田玉鉴定方面有独特优势。',
    features: [{ name: '和田玉专家', description: '产地鉴定权威' }],
    certTypes: [
      { code: 'jade', name: '和田玉', price: 40 },
      { code: 'gemstone', name: '宝石', price: 50 }
    ],
    pricing: [{ type: '普通', price: 40, currency: 'CNY', days: 7 }],
    certifications: ['CMA'],
    branches: [
      {
        city: '乌鲁木齐',
        address: '乌鲁木齐市沙依巴克区',
        phone: '0991-4685932'
      }
    ],
    avgProcessingDays: 7,
    authority: 7,
    sortOrder: 6
  },
  {
    code: 'BJGTC',
    name: '北京质检',
    fullName: '北京市珠宝玉石鉴定中心',
    country: '中国',
    region: 'china',
    website: 'http://www.bjzb.org.cn',
    verifyUrl: 'http://www.bjzb.org.cn/search',
    description: '北京地区权威检测机构，服务北京珠宝市场。',
    features: [{ name: '首都权威', description: '服务北京市场' }],
    certTypes: [
      { code: 'jade', name: '翡翠', price: 50 },
      { code: 'diamond', name: '钻石', price: 100 },
      { code: 'gold', name: '贵金属', price: 35 }
    ],
    pricing: [{ type: '普通', price: 50, currency: 'CNY', days: 5 }],
    certifications: ['CMA', 'CAL'],
    branches: [
      { city: '北京', address: '北京市西城区西单北大街', phone: '010-66013718' }
    ],
    avgProcessingDays: 5,
    authority: 8,
    sortOrder: 7
  },

  // ========== 高校检测中心 ==========
  {
    code: 'CGL-CUGB',
    name: 'CGL地大北京',
    fullName: '中国地质大学(北京)珠宝检测中心',
    country: '中国',
    region: 'china',
    website: 'http://www.cugb.edu.cn',
    verifyUrl: '',
    description: '依托中国地质大学宝石学专业，在学术鉴定方面有权威性。',
    features: [
      { name: '学术权威', description: '高校科研支撑' },
      { name: '专业人才', description: '宝石学专业培养基地' }
    ],
    certTypes: [
      { code: 'gemstone', name: '彩色宝石', price: 60 },
      { code: 'jade', name: '玉石', price: 45 }
    ],
    pricing: [{ type: '普通', price: 50, currency: 'CNY', days: 7 }],
    certifications: ['CMA'],
    branches: [
      { city: '北京', address: '北京市海淀区学院路29号', phone: '010-82322244' }
    ],
    avgProcessingDays: 7,
    authority: 7,
    sortOrder: 8
  },
  {
    code: 'CGL-CUGW',
    name: 'CGL地大武汉',
    fullName: '中国地质大学(武汉)珠宝检测中心',
    country: '中国',
    region: 'china',
    website: 'http://www.cug.edu.cn',
    verifyUrl: '',
    description: '中国地质大学武汉校区珠宝检测中心，GIC证书培训基地。',
    features: [{ name: 'GIC培训', description: 'GIC证书考试基地' }],
    certTypes: [
      { code: 'gemstone', name: '彩色宝石', price: 55 },
      { code: 'jade', name: '玉石', price: 40 }
    ],
    pricing: [{ type: '普通', price: 45, currency: 'CNY', days: 7 }],
    certifications: ['CMA'],
    branches: [
      {
        city: '武汉',
        address: '武汉市洪山区鲁磨路388号',
        phone: '027-67883751'
      }
    ],
    avgProcessingDays: 7,
    authority: 7,
    sortOrder: 9
  },

  // ========== 专业机构 ==========
  {
    code: 'NGDTC',
    name: 'NGDTC',
    fullName: '国家金银制品质量监督检验中心',
    country: '中国',
    region: 'china',
    website: 'http://www.ngdtc.cn',
    verifyUrl: 'http://www.ngdtc.cn/search',
    description: '专注贵金属检测的国家级机构。',
    features: [{ name: '贵金属专家', description: '黄金铂金银饰检测' }],
    certTypes: [
      { code: 'gold', name: '黄金', price: 25 },
      { code: 'platinum', name: '铂金', price: 30 },
      { code: 'silver', name: '银饰', price: 20 }
    ],
    pricing: [{ type: '普通', price: 25, currency: 'CNY', days: 3 }],
    certifications: ['CMA', 'CAL', 'CNAS'],
    branches: [
      {
        city: '上海',
        address: '上海市闵行区沪闵路800号',
        phone: '021-54336600'
      }
    ],
    avgProcessingDays: 3,
    authority: 9,
    sortOrder: 10
  },
  {
    code: 'NFGJC',
    name: '南方检测',
    fullName: '国家首饰质量监督检验中心(深圳)',
    country: '中国',
    region: 'china',
    website: 'http://www.nfgjc.com',
    verifyUrl: 'http://www.nfgjc.com/search',
    description: '深圳国家级首饰质量检测中心，服务深圳珠宝产业。',
    features: [
      { name: '国家级', description: '深圳国家级检测中心' },
      { name: '产业配套', description: '服务水贝珠宝市场' }
    ],
    certTypes: [
      { code: 'jade', name: '翡翠', price: 45 },
      { code: 'diamond', name: '钻石', price: 85 },
      { code: 'gold', name: '贵金属', price: 28 }
    ],
    pricing: [
      { type: '普通', price: 45, currency: 'CNY', days: 4 },
      { type: '加急', price: 90, currency: 'CNY', days: 1 }
    ],
    certifications: ['CMA', 'CAL', 'CNAS'],
    branches: [
      {
        city: '深圳',
        address: '深圳市罗湖区翠竹路2109号',
        phone: '0755-25162951'
      }
    ],
    avgProcessingDays: 4,
    authority: 9,
    sortOrder: 11
  },
  {
    code: 'SGTC',
    name: '四川质检',
    fullName: '四川省珠宝玉石首饰质量监督站',
    country: '中国',
    region: 'china',
    website: 'http://www.sczbys.com',
    verifyUrl: '',
    description: '四川省权威检测机构，服务西南珠宝市场。',
    features: [{ name: '西南权威', description: '服务成都珠宝市场' }],
    certTypes: [
      { code: 'jade', name: '翡翠', price: 40 },
      { code: 'gemstone', name: '宝石', price: 50 }
    ],
    pricing: [{ type: '普通', price: 40, currency: 'CNY', days: 5 }],
    certifications: ['CMA'],
    branches: [
      { city: '成都', address: '成都市锦江区东大街', phone: '028-86665818' }
    ],
    avgProcessingDays: 5,
    authority: 7,
    sortOrder: 12
  }
];

async function seedChinaInstitutions() {
  console.log('🔷 开始导入中国检测机构数据...');

  try {
    for (const inst of chinaInstitutions) {
      const existing = await db
        .select()
        .from(certInstitutions)
        .where(eq(certInstitutions.code, inst.code))
        .limit(1);

      if (existing.length > 0) {
        // 更新现有记录
        await db
          .update(certInstitutions)
          .set({
            ...inst,
            updatedAt: new Date()
          } as any)
          .where(eq(certInstitutions.code, inst.code));
        console.log(`  📝 更新: ${inst.code} - ${inst.fullName}`);
      } else {
        await db.insert(certInstitutions).values(inst as any);
        console.log(`  ✅ 新增: ${inst.code} - ${inst.fullName}`);
      }
    }

    console.log('\n✨ 中国检测机构数据导入完成！');
    console.log(`  共 ${chinaInstitutions.length} 家机构`);
  } catch (error) {
    console.error('❌ 导入失败:', error);
    throw error;
  }
}

export { seedChinaInstitutions, chinaInstitutions };

if (require.main === module) {
  seedChinaInstitutions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
