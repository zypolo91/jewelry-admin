/**
 * 证书机构数据种子脚本
 * 包含全球主要珠宝鉴定机构的详细信息
 */
import { db } from '../db';
import {
  certInstitutions,
  certKnowledge,
  certImageFeatures
} from '../db/schema';
import { eq } from 'drizzle-orm';

// 国际知名鉴定机构数据
const institutionsData = [
  // ========== 国际机构 ==========
  {
    code: 'GIA',
    name: 'GIA',
    fullName: 'Gemological Institute of America',
    country: '美国',
    region: 'international',
    logo: 'https://www.gia.edu/images/GIA-logo.svg',
    website: 'https://www.gia.edu',
    verifyUrl: 'https://www.gia.edu/report-check-landing',
    description:
      'GIA是全球最权威的宝石学研究和教育机构，创立于1931年。GIA发明了著名的钻石4C分级标准（克拉重量、颜色、净度、切工），这一标准已成为全球钻石分级的通用语言。GIA证书是钻石交易中最受认可的鉴定报告。',
    features: [
      { name: '4C标准创始者', description: '发明并推广钻石4C分级系统' },
      { name: '全球认可', description: '证书在全球范围内被广泛认可' },
      { name: '严格标准', description: '采用最严格的分级标准' },
      { name: '防伪技术', description: '多重防伪技术保护证书真实性' }
    ],
    certTypes: [
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
    ],
    sampleImages: [
      'https://example.com/gia-diamond-report.jpg',
      'https://example.com/gia-colored-stone.jpg'
    ],
    recognitionFeatures: {
      watermark: true,
      qrCode: true,
      hologram: true,
      microPrint: true,
      laserInscription: true
    },
    authority: 10,
    sortOrder: 1
  },
  {
    code: 'IGI',
    name: 'IGI',
    fullName: 'International Gemological Institute',
    country: '比利时',
    region: 'international',
    logo: 'https://www.igi.org/images/igi-logo.png',
    website: 'https://www.igi.org',
    verifyUrl: 'https://www.igi.org/verify.php',
    description:
      'IGI成立于1975年，是全球最大的独立宝石学鉴定机构之一。在全球拥有20多个实验室，以快速出证和性价比高著称。IGI在亚洲市场占有率很高，特别是在印度和中国。',
    features: [
      { name: '全球网络', description: '遍布全球的鉴定实验室' },
      { name: '快速服务', description: '相对较快的出证速度' },
      { name: '性价比高', description: '价格相对亲民' },
      { name: '培育钻石专家', description: '在培育钻石鉴定领域领先' }
    ],
    certTypes: [
      { code: 'diamond', name: '钻石报告', description: '天然钻石分级' },
      {
        code: 'lab-grown',
        name: '培育钻石报告',
        description: '实验室培育钻石'
      },
      { code: 'jewelry', name: '珠宝鉴定', description: '成品珠宝鉴定' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      qrCode: true,
      hologram: true
    },
    authority: 8,
    sortOrder: 2
  },
  {
    code: 'HRD',
    name: 'HRD',
    fullName: 'Hoge Raad voor Diamant',
    country: '比利时',
    region: 'europe',
    logo: 'https://www.hrdantwerp.com/images/logo.png',
    website: 'https://www.hrdantwerp.com',
    verifyUrl: 'https://my.hrdantwerp.com/',
    description:
      'HRD安特卫普是欧洲最权威的钻石鉴定机构，位于世界钻石贸易中心安特卫普。HRD的分级标准被认为比GIA更加严格，特别是在颜色和净度方面。',
    features: [
      { name: '欧洲权威', description: '欧洲最受认可的鉴定机构' },
      { name: '严格标准', description: '分级标准比GIA更严格' },
      { name: '安特卫普背书', description: '世界钻石之都的权威机构' }
    ],
    certTypes: [
      { code: 'diamond', name: '钻石证书', description: '详细钻石分级' },
      { code: 'diamond-id', name: '钻石身份证', description: '简化版报告' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      hologram: true,
      microPrint: true
    },
    authority: 9,
    sortOrder: 3
  },
  {
    code: 'AGS',
    name: 'AGS',
    fullName: 'American Gem Society',
    country: '美国',
    region: 'usa',
    logo: 'https://www.americangemsociety.org/images/logo.png',
    website: 'https://www.americangemsociety.org',
    verifyUrl: 'https://www.agslab.com/verify',
    description:
      'AGS成立于1934年，是美国历史悠久的宝石学协会。AGS以其独特的切工分级系统著称，采用0-10的数字分级，0代表最完美的切工。',
    features: [
      { name: '切工专家', description: '独特的切工分级系统' },
      { name: '0-10分级', description: '直观的数字分级体系' },
      { name: '理想切工', description: '定义了理想切工标准' }
    ],
    certTypes: [
      { code: 'diamond', name: '钻石品质报告', description: '含光学性能分析' },
      { code: 'ideal', name: '理想切工报告', description: '专注切工评估' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      qrCode: true
    },
    authority: 8,
    sortOrder: 4
  },
  // ========== 中国机构 ==========
  {
    code: 'NGTC',
    name: 'NGTC',
    fullName: '国家珠宝玉石质量监督检验中心',
    country: '中国',
    region: 'china',
    logo: 'https://www.ngtc.com.cn/images/logo.png',
    website: 'https://www.ngtc.com.cn',
    verifyUrl: 'https://www.ngtc.com.cn/zscx/index.html',
    description:
      'NGTC是中国最权威的珠宝玉石检测机构，隶属于自然资源部珠宝玉石首饰管理中心。NGTC制定了中国珠宝玉石行业的国家标准，其证书在国内市场具有最高权威性。',
    features: [
      { name: '国家级机构', description: '国家质检系统权威机构' },
      { name: '标准制定者', description: '制定中国珠宝玉石国家标准' },
      { name: '翡翠专家', description: '在翡翠鉴定领域具有权威' },
      { name: '全国联网', description: '证书可在线查询验真' }
    ],
    certTypes: [
      { code: 'jade', name: '翡翠鉴定', description: 'A/B/C货鉴定' },
      { code: 'diamond', name: '钻石分级', description: '按国标分级' },
      { code: 'gemstone', name: '彩色宝石', description: '红蓝宝石等鉴定' },
      { code: 'pearl', name: '珍珠鉴定', description: '珍珠品质评估' },
      { code: 'gold', name: '贵金属检测', description: '黄金纯度检测' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      qrCode: true,
      hologram: true,
      officialSeal: true
    },
    authority: 10,
    sortOrder: 5
  },
  {
    code: 'GTC',
    name: 'GTC',
    fullName: '广东省珠宝玉石及贵金属检测中心',
    country: '中国',
    region: 'china',
    logo: 'https://www.gtc-china.cn/images/logo.png',
    website: 'https://www.gtc-china.cn',
    verifyUrl: 'https://www.gtc-china.cn/search',
    description:
      'GTC是广东省最具影响力的珠宝检测机构，服务于广东这个中国最大的珠宝加工和贸易中心。在翡翠、钻石和黄金检测方面具有丰富经验。',
    features: [
      { name: '区域权威', description: '广东省权威检测机构' },
      { name: '产业配套', description: '服务珠宝产业集群' },
      { name: '快速服务', description: '提供加急检测服务' }
    ],
    certTypes: [
      { code: 'jade', name: '翡翠鉴定', description: '翡翠真伪和品质' },
      { code: 'diamond', name: '钻石检测', description: '钻石4C分级' },
      { code: 'gold', name: '贵金属', description: '含量检测' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      qrCode: true,
      officialSeal: true
    },
    authority: 8,
    sortOrder: 6
  },
  {
    code: 'NGDTC',
    name: 'NGDTC',
    fullName: '国家金银制品质量监督检验中心',
    country: '中国',
    region: 'china',
    logo: '',
    website: 'http://www.ngdtc.cn',
    verifyUrl: 'http://www.ngdtc.cn/search',
    description:
      'NGDTC专注于贵金属制品的检测，是国家级金银制品质量监督检验机构。在黄金、铂金、银饰品的含量检测方面具有权威性。',
    features: [
      { name: '贵金属专家', description: '专注贵金属检测' },
      { name: '国家授权', description: '国家级检测机构' }
    ],
    certTypes: [
      { code: 'gold', name: '黄金检测', description: '黄金纯度和成色' },
      { code: 'platinum', name: '铂金检测', description: '铂金含量检测' },
      { code: 'silver', name: '银饰检测', description: '银含量检测' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      officialSeal: true
    },
    authority: 9,
    sortOrder: 7
  },
  {
    code: 'CGL',
    name: 'CGL',
    fullName: '中国地质大学珠宝检测中心',
    country: '中国',
    region: 'china',
    logo: '',
    website: 'http://www.cugb.edu.cn',
    verifyUrl: '',
    description:
      'CGL依托中国地质大学的宝石学专业优势，在彩色宝石和翡翠鉴定方面具有学术权威性。',
    features: [
      { name: '学术背景', description: '高校科研支撑' },
      { name: '宝石学专业', description: '专业人才培养基地' }
    ],
    certTypes: [
      { code: 'gemstone', name: '彩色宝石', description: '宝石种类鉴定' },
      { code: 'jade', name: '玉石鉴定', description: '翡翠和田玉等' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      officialSeal: true
    },
    authority: 7,
    sortOrder: 8
  },
  // ========== 其他亚洲机构 ==========
  {
    code: 'GRS',
    name: 'GRS',
    fullName: 'Gübelin Gem Lab / GRS Gemresearch Swisslab',
    country: '瑞士',
    region: 'international',
    logo: '',
    website: 'https://gemresearch.ch',
    verifyUrl: 'https://gemresearch.ch/verify',
    description:
      'GRS是瑞士知名的彩色宝石鉴定机构，在红宝石、蓝宝石、祖母绿等高端彩色宝石的产地鉴定和品质评估方面享有盛誉。',
    features: [
      { name: '彩色宝石专家', description: '顶级彩色宝石鉴定' },
      { name: '产地鉴定', description: '精准的产地追溯' },
      { name: '瑞士精准', description: '瑞士精密鉴定传统' }
    ],
    certTypes: [
      { code: 'ruby', name: '红宝石报告', description: '含产地和处理信息' },
      { code: 'sapphire', name: '蓝宝石报告', description: '含产地和处理信息' },
      { code: 'emerald', name: '祖母绿报告', description: '含产地和处理信息' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      qrCode: true,
      hologram: true
    },
    authority: 9,
    sortOrder: 9
  },
  {
    code: 'SSEF',
    name: 'SSEF',
    fullName: 'Swiss Gemmological Institute',
    country: '瑞士',
    region: 'international',
    logo: '',
    website: 'https://www.ssef.ch',
    verifyUrl: 'https://www.ssef.ch/verify',
    description:
      'SSEF是瑞士历史最悠久的宝石鉴定机构之一，在高端拍卖行和收藏级宝石鉴定中具有崇高地位。',
    features: [
      { name: '拍卖级鉴定', description: '顶级拍卖行首选' },
      { name: '历史悠久', description: '超过百年历史' },
      { name: '收藏级权威', description: '收藏级宝石鉴定' }
    ],
    certTypes: [
      { code: 'gemstone', name: '宝石鉴定', description: '高端宝石全面鉴定' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      hologram: true
    },
    authority: 9,
    sortOrder: 10
  },
  {
    code: 'CGL-JP',
    name: 'CGL日本',
    fullName: 'Central Gem Laboratory',
    country: '日本',
    region: 'asia',
    logo: '',
    website: 'https://www.cgl.co.jp',
    verifyUrl: 'https://www.cgl.co.jp/verify',
    description:
      'CGL是日本最权威的宝石鉴定机构，其证书在日本市场被广泛认可。在钻石和珍珠鉴定方面具有专业优势。',
    features: [
      { name: '日本权威', description: '日本最具公信力的机构' },
      { name: '珍珠专家', description: '日本珍珠鉴定权威' }
    ],
    certTypes: [
      { code: 'diamond', name: '钻石报告', description: '钻石分级' },
      { code: 'pearl', name: '珍珠报告', description: 'Akoya珍珠专业鉴定' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      hologram: true
    },
    authority: 8,
    sortOrder: 11
  },
  {
    code: 'GUILD',
    name: 'GUILD',
    fullName: 'Guild Gem Laboratories',
    country: '香港',
    region: 'asia',
    logo: '',
    website: 'https://www.guildlab.com',
    verifyUrl: 'https://www.guildlab.com/verify',
    description:
      'GUILD是亚洲新兴的专业宝石鉴定机构，在彩色宝石鉴定方面快速崛起，特别是对亚洲市场偏好的宝石类型有深入研究。',
    features: [
      { name: '亚洲市场', description: '深耕亚洲珠宝市场' },
      { name: '彩色宝石', description: '彩色宝石鉴定专家' }
    ],
    certTypes: [
      { code: 'gemstone', name: '彩色宝石', description: '全面的彩宝鉴定' }
    ],
    sampleImages: [],
    recognitionFeatures: {
      watermark: true,
      qrCode: true
    },
    authority: 7,
    sortOrder: 12
  }
];

// 证书知识库数据
const knowledgeData = [
  // ========== 基础知识 ==========
  {
    category: 'basics',
    title: '什么是珠宝鉴定证书？',
    summary: '了解珠宝鉴定证书的基本概念和重要性',
    content: `# 什么是珠宝鉴定证书？

珠宝鉴定证书是由专业鉴定机构出具的，对珠宝玉石的真伪、品质、特征等进行科学检测后形成的书面报告。

## 证书的重要性

1. **真伪保障**：证明珠宝的真实性
2. **品质证明**：客观评估珠宝的品质等级
3. **交易依据**：作为买卖双方的交易凭证
4. **价值参考**：帮助了解珠宝的市场价值

## 证书包含的信息

- 检测机构信息
- 检测日期和证书编号
- 珠宝的物理特征（重量、尺寸、颜色等）
- 品质分级结果
- 鉴定结论

## 如何查验证书真伪

1. 登录官网查询证书编号
2. 核对证书上的防伪特征
3. 确认检测机构的资质`,
    tags: ['基础', '入门', '证书'],
    relatedInstitutions: ['GIA', 'NGTC', 'IGI'],
    sortOrder: 1
  },
  {
    category: 'basics',
    title: '钻石4C分级标准详解',
    summary: '深入了解GIA发明的钻石4C分级系统',
    content: `# 钻石4C分级标准

4C是评估钻石品质的国际通用标准，由GIA于1953年创立。

## 1. Carat（克拉重量）

- 1克拉 = 0.2克 = 100分
- 重量越大，价值越高
- 相同品质下，克拉溢价明显

## 2. Color（颜色）

从D到Z分级：
- **D-F**：无色，最珍贵
- **G-J**：近无色，性价比高
- **K-M**：微黄
- **N-Z**：淡黄

## 3. Clarity（净度）

从高到低：
- **FL/IF**：无瑕/内无瑕
- **VVS1/VVS2**：极微瑕
- **VS1/VS2**：微瑕
- **SI1/SI2**：小瑕
- **I1/I2/I3**：有瑕

## 4. Cut（切工）

GIA切工分级：
- **Excellent**：完美
- **Very Good**：非常好
- **Good**：好
- **Fair**：一般
- **Poor**：差

## 选购建议

- 预算有限时优先考虑切工
- 颜色G-H级肉眼难辨
- 净度VS级以上即可`,
    tags: ['钻石', '4C', '分级', 'GIA'],
    relatedInstitutions: ['GIA', 'IGI', 'HRD'],
    sortOrder: 2
  },
  {
    category: 'basics',
    title: '翡翠A/B/C货的区别',
    summary: '了解翡翠处理方式的分类标准',
    content: `# 翡翠A/B/C货的区别

翡翠根据是否经过人工处理，分为A货、B货、C货三类。

## A货翡翠

**定义**：天然翡翠，仅经过传统加工（切割、抛光、打蜡）

**特点**：
- 颜色天然
- 结构完整
- 价值最高
- 具有收藏价值

## B货翡翠

**定义**：经过酸洗和注胶处理的翡翠

**处理过程**：
1. 强酸浸泡去除杂质
2. 碱液中和
3. 注入环氧树脂填充

**特点**：
- 透明度提高
- 结构被破坏
- 时间久了会变黄
- 价值较低

## C货翡翠

**定义**：经过染色处理的翡翠

**特点**：
- 颜色不自然
- 颜色集中在裂隙中
- 价值最低

## B+C货

同时经过注胶和染色处理。

## 如何鉴别

1. **看光泽**：A货呈玻璃光泽，B货较呆滞
2. **听声音**：A货敲击声清脆
3. **放大观察**：B货有网状纹
4. **送检**：最可靠的方法`,
    tags: ['翡翠', 'A货', 'B货', 'C货', '鉴定'],
    relatedInstitutions: ['NGTC', 'GTC'],
    sortOrder: 3
  },
  // ========== 鉴定指南 ==========
  {
    category: 'identification',
    title: '如何识别GIA证书真伪',
    summary: '详解GIA证书的防伪特征和验证方法',
    content: `# 如何识别GIA证书真伪

GIA证书采用多重防伪技术，了解这些特征可以帮助您识别真伪。

## 证书防伪特征

### 1. 全息防伪标签
- 位于证书右上角
- 倾斜时可见3D图像变化
- 包含GIA标志

### 2. 水印
- 对光可见GIA水印
- 分布均匀

### 3. 微缩文字
- 放大镜下可见
- 边框处有"GIA"微缩字

### 4. 激光刻字
- 钻石腰部刻有证书编号
- 需用放大镜查看

## 在线验证步骤

1. 访问 gia.edu/report-check-landing
2. 输入证书编号
3. 核对显示信息与证书一致
4. 确认钻石特征匹配

## 常见造假手段

- 伪造证书配低品质钻石
- 修改证书上的等级
- 使用过期或作废证书

## 安全建议

- 务必在线验证
- 核对激光刻字
- 选择正规渠道购买`,
    tags: ['GIA', '防伪', '验证', '鉴定'],
    relatedInstitutions: ['GIA'],
    sortOrder: 4
  },
  {
    category: 'identification',
    title: 'NGTC证书查询指南',
    summary: '详细介绍如何查询验证NGTC证书',
    content: `# NGTC证书查询指南

NGTC（国家珠宝玉石质量监督检验中心）证书可通过官方渠道在线查询。

## 查询方式

### 方式一：官网查询
1. 访问 www.ngtc.com.cn
2. 点击"证书查询"
3. 输入证书编号和验证码
4. 查看检测结果

### 方式二：微信查询
1. 关注"NGTC国检珠宝"公众号
2. 点击"证书查询"菜单
3. 输入证书编号

### 方式三：扫码查询
- 扫描证书上的二维码
- 直接查看检测结果

## 证书信息核对

查询后需核对：
- 检测日期
- 样品描述
- 检测结论
- 重量尺寸

## 注意事项

- 证书编号区分大小写
- 部分老证书可能未联网
- 如有疑问可致电客服`,
    tags: ['NGTC', '查询', '验证', '国检'],
    relatedInstitutions: ['NGTC'],
    sortOrder: 5
  },
  // ========== 常见问题 ==========
  {
    category: 'faq',
    title: '不同机构证书的权威性比较',
    summary: '对比各大鉴定机构的特点和适用场景',
    content: `# 不同机构证书的权威性比较

## 国际机构排名

### 第一梯队（最高权威）
- **GIA**：全球公认最权威，钻石4C标准创始者
- **NGTC**：中国最权威，国家级机构

### 第二梯队（高权威）
- **HRD**：欧洲权威，标准严格
- **AGS**：美国老牌，切工评估出色
- **IGI**：全球化布局，培育钻石专家

### 第三梯队（区域权威）
- **GTC**：广东权威
- **GRS/SSEF**：彩色宝石专家
- **CGL日本**：日本市场权威

## 选择建议

| 珠宝类型 | 推荐机构 |
|---------|---------|
| 钻石（国际交易）| GIA |
| 钻石（国内）| NGTC、GIA |
| 翡翠 | NGTC、GTC |
| 培育钻石 | IGI |
| 高端彩宝 | GRS、SSEF |
| 日本珍珠 | CGL日本 |

## 价格参考

- GIA：较贵，但保值性好
- IGI：中等，性价比高
- NGTC：国内标准，价格实惠`,
    tags: ['比较', '权威', '选择', '机构'],
    relatedInstitutions: ['GIA', 'NGTC', 'IGI', 'HRD'],
    sortOrder: 6
  },
  {
    category: 'faq',
    title: '证书丢失了怎么办？',
    summary: '证书遗失后的补办流程和注意事项',
    content: `# 证书丢失了怎么办？

## GIA证书补办

1. **访问GIA官网**
2. **提交补证申请**
   - 需提供钻石
   - 填写申请表
3. **支付费用**：约$20-50
4. **等待出证**：7-14个工作日

## NGTC证书补办

1. **联系原检测点**
2. **携带珠宝原件**
3. **填写补证申请**
4. **重新检测**
5. **领取新证书**

## 注意事项

- 部分机构只能重新鉴定，不能补发原证书
- 新证书编号可能不同
- 保留好购买凭证有助于追溯
- 建议拍照备份证书

## 预防措施

- 证书拍照存档
- 使用证书管理APP
- 保存在安全地方
- 购买保险时登记`,
    tags: ['补办', '丢失', '证书', '流程'],
    relatedInstitutions: ['GIA', 'NGTC'],
    sortOrder: 7
  }
];

// 证书图像特征数据
const imageFeaturesData = [
  // GIA证书特征
  {
    institutionCode: 'GIA',
    featureType: 'hologram',
    featureName: 'GIA全息标签',
    description: '右上角3D变化全息图',
    isRequired: true
  },
  {
    institutionCode: 'GIA',
    featureType: 'watermark',
    featureName: 'GIA水印',
    description: '对光可见的GIA标志水印',
    isRequired: true
  },
  {
    institutionCode: 'GIA',
    featureType: 'microprint',
    featureName: '微缩文字',
    description: '边框处GIA微缩字',
    isRequired: true
  },
  {
    institutionCode: 'GIA',
    featureType: 'qrcode',
    featureName: '二维码',
    description: '可扫描验证的二维码',
    isRequired: true
  },
  {
    institutionCode: 'GIA',
    featureType: 'layout',
    featureName: '版面布局',
    description: '标准GIA报告格式',
    isRequired: true
  },

  // NGTC证书特征
  {
    institutionCode: 'NGTC',
    featureType: 'seal',
    featureName: '检测专用章',
    description: '红色椭圆形检测专用章',
    isRequired: true
  },
  {
    institutionCode: 'NGTC',
    featureType: 'qrcode',
    featureName: '二维码',
    description: '可扫描查询的二维码',
    isRequired: true
  },
  {
    institutionCode: 'NGTC',
    featureType: 'hologram',
    featureName: '防伪标签',
    description: 'NGTC防伪全息标签',
    isRequired: true
  },
  {
    institutionCode: 'NGTC',
    featureType: 'layout',
    featureName: '标准版式',
    description: 'NGTC标准证书格式',
    isRequired: true
  },

  // IGI证书特征
  {
    institutionCode: 'IGI',
    featureType: 'hologram',
    featureName: 'IGI全息标',
    description: 'IGI Logo全息防伪',
    isRequired: true
  },
  {
    institutionCode: 'IGI',
    featureType: 'qrcode',
    featureName: '验证二维码',
    description: '在线验证二维码',
    isRequired: true
  },
  {
    institutionCode: 'IGI',
    featureType: 'watermark',
    featureName: '水印',
    description: 'IGI底纹水印',
    isRequired: false
  }
];

async function seedCertificates() {
  console.log('🔷 开始导入证书机构数据...');

  try {
    // 导入机构数据
    for (const inst of institutionsData) {
      const existing = await db
        .select()
        .from(certInstitutions)
        .where(eq(certInstitutions.code, inst.code))
        .limit(1);

      if (!existing || existing.length === 0) {
        await db.insert(certInstitutions).values(inst as any);
        console.log(`  ✅ 添加机构: ${inst.code} - ${inst.name}`);
      } else {
        console.log(`  ⏭️ 机构已存在: ${inst.code}`);
      }
    }

    // 导入知识库数据
    console.log('\n🔷 开始导入证书知识库...');
    for (const knowledge of knowledgeData) {
      await db.insert(certKnowledge).values(knowledge as any);
      console.log(`  ✅ 添加知识: ${knowledge.title}`);
    }

    // 导入图像特征数据
    console.log('\n🔷 开始导入图像特征数据...');
    for (const feature of imageFeaturesData) {
      // 查找机构ID
      const [inst] = await db
        .select()
        .from(certInstitutions)
        .where(eq(certInstitutions.code, feature.institutionCode))
        .limit(1);

      if (inst) {
        await db.insert(certImageFeatures).values({
          institutionId: inst.id,
          featureType: feature.featureType,
          featureName: feature.featureName,
          description: feature.description,
          isRequired: feature.isRequired
        } as any);
        console.log(
          `  ✅ 添加特征: ${feature.institutionCode} - ${feature.featureName}`
        );
      }
    }

    console.log('\n✨ 证书数据导入完成！');
  } catch (error) {
    console.error('❌ 导入失败:', error);
    throw error;
  }
}

// 导出供外部调用
export { seedCertificates, institutionsData, knowledgeData };

// 如果直接运行此脚本
if (require.main === module) {
  seedCertificates()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
