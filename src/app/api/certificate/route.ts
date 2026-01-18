import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { zhipuAIService } from '@/service/zhipu-ai.service';
import { db } from '@/db';
import {
  certInstitutions,
  certKnowledge,
  certVerifications,
  certImageFeatures
} from '@/db/schema';
import { eq, like, desc, asc } from 'drizzle-orm';

// 备用静态数据（数据库无数据时使用）
const fallbackInstitutions = [
  {
    id: 1,
    code: 'NGTC',
    name: 'NGTC',
    fullName: '国家珠宝玉石质量监督检验中心',
    country: '中国',
    region: 'china',
    website: 'https://www.ngtc.com.cn',
    verifyUrl: 'https://www.ngtc.com.cn/zscx/index.html',
    description:
      'NGTC是中国最权威的珠宝玉石检测机构，隶属于自然资源部珠宝玉石首饰管理中心。',
    features: [{ name: '国家级机构', description: '国家质检系统权威机构' }],
    authority: 10
  },
  {
    id: 2,
    code: 'GIA',
    name: 'GIA',
    fullName: 'Gemological Institute of America',
    country: '美国',
    region: 'international',
    website: 'https://www.gia.edu',
    verifyUrl: 'https://www.gia.edu/report-check-landing',
    description:
      'GIA是全球最权威的宝石学研究和教育机构，创立了著名的钻石4C分级标准。',
    features: [
      { name: '4C标准创始者', description: '发明并推广钻石4C分级系统' }
    ],
    authority: 10
  },
  {
    id: 3,
    code: 'IGI',
    name: 'IGI',
    fullName: 'International Gemological Institute',
    country: '比利时',
    region: 'international',
    website: 'https://www.igi.org',
    verifyUrl: 'https://www.igi.org/verify.php',
    description: 'IGI成立于1975年，是全球最大的独立宝石学鉴定机构之一。',
    features: [{ name: '全球网络', description: '遍布全球的鉴定实验室' }],
    authority: 8
  },
  {
    id: 4,
    code: 'HRD',
    name: 'HRD',
    fullName: 'Hoge Raad voor Diamant',
    country: '比利时',
    region: 'europe',
    website: 'https://www.hrdantwerp.com',
    verifyUrl: 'https://my.hrdantwerp.com/',
    description: 'HRD安特卫普是欧洲最权威的钻石鉴定机构。',
    features: [{ name: '欧洲权威', description: '欧洲最受认可的鉴定机构' }],
    authority: 9
  },
  {
    id: 5,
    code: 'GTC',
    name: 'GTC',
    fullName: '广东省珠宝玉石及贵金属检测中心',
    country: '中国',
    region: 'china',
    website: 'https://www.gtc-china.cn',
    verifyUrl: 'https://www.gtc-china.cn/search',
    description: 'GTC是广东省最具影响力的珠宝检测机构。',
    features: [{ name: '区域权威', description: '广东省权威检测机构' }],
    authority: 8
  }
];

// 证书知识库
const certificateKnowledge = [
  {
    id: 'diamond-4c',
    title: '钻石4C标准详解',
    category: 'diamond',
    icon: '💎',
    content: `钻石4C是评估钻石品质的国际标准：

**1. Carat（克拉重量）**
- 1克拉 = 0.2克 = 100分
- 重量越大，价值越高
- 同等品质下，1克拉以上钻石价值显著增加

**2. Color（颜色）**
- D-F：无色级别，最珍贵
- G-J：近无色级别，性价比高
- K-M：微黄色
- N-Z：淡黄色

**3. Clarity（净度）**
- FL/IF：无暇/内无暇
- VVS1/VVS2：极微暇
- VS1/VS2：微暇
- SI1/SI2：小暇
- I1/I2/I3：有暇

**4. Cut（切工）**
- Excellent：理想切工
- Very Good：非常好
- Good：好
- Fair：一般
- Poor：差`
  },
  {
    id: 'jade-abc',
    title: '翡翠A/B/C货鉴别',
    category: 'jade',
    icon: '🟢',
    content: `**A货翡翠**
- 天然翡翠，未经任何化学处理
- 仅进行切割、打磨、抛光
- 证书会标注"翡翠"或"天然翡翠"

**B货翡翠**
- 经过酸洗去除杂质
- 注入树脂填充
- 证书会标注"翡翠（处理）"或"翡翠（B货）"

**C货翡翠**
- 经过染色处理
- 颜色不自然
- 证书会标注"翡翠（染色）"

**B+C货**
- 既经过酸洗注胶，又进行染色
- 证书会标注"翡翠（处理+染色）"

**鉴别要点**
1. 看证书标注
2. 紫外灯下B货会有荧光反应
3. A货敲击声清脆，B货声音沉闷`
  },
  {
    id: 'gold-purity',
    title: '黄金纯度标识解读',
    category: 'gold',
    icon: '🥇',
    content: `**常见黄金纯度标识**

**足金/千足金**
- 含金量≥99.9%
- 标识：Au999、999金、千足金

**足金**
- 含金量≥99.0%
- 标识：Au990、990金、足金

**22K金**
- 含金量≈91.6%
- 标识：Au916、916金

**18K金**
- 含金量=75%
- 标识：Au750、750金、18K
- 常用于镶嵌珠宝，硬度较高

**14K金**
- 含金量≈58.5%
- 标识：Au585、585金、14K

**证书查看要点**
1. 检测结论：是否为黄金
2. 纯度/成色：具体含金量
3. 重量：与实物是否一致
4. 检测机构资质`
  },
  {
    id: 'pearl-quality',
    title: '珍珠品质评估',
    category: 'pearl',
    icon: '🦪',
    content: `**珍珠品质评估5要素**

**1. 光泽**
- 极强光泽：镜面反射
- 强光泽：清晰反射
- 中等光泽：模糊反射
- 弱光泽：几乎无反射

**2. 表面质量**
- 无暇：肉眼看不到瑕疵
- 微暇：有少量小瑕疵
- 小暇：有明显瑕疵
- 有暇：瑕疵较多

**3. 形状**
- 正圆：最珍贵
- 近圆：略有偏差
- 椭圆/水滴：有独特美感
- 异形：巴洛克珍珠

**4. 颜色**
- 体色：白、粉、金、黑等
- 伴色：粉红、绿色等
- 晕彩：珍珠层产生的彩虹效果

**5. 大小**
- 直径越大越珍贵
- 同品质下，大1mm价格可能翻倍`
  },
  {
    id: 'certificate-reading',
    title: '如何看懂鉴定证书',
    category: 'general',
    icon: '📋',
    content: `**证书必看项目**

**1. 检测机构信息**
- 机构名称和资质
- CMA/CAL/CNAS认证标志
- 联系方式和地址

**2. 样品信息**
- 检测结论（最重要）
- 总质量/重量
- 颜色描述
- 形状/切工

**3. 检测项目**
- 折射率
- 密度
- 放大检查
- 光谱分析

**4. 防伪特征**
- 证书编号
- 二维码
- 防伪水印
- 钢印

**5. 验证方式**
- 官网查询
- 电话查询
- 扫码查询

**注意事项**
- 证书应与实物一一对应
- 注意证书有效期
- 警惕假证书`
  }
];

// 证书编号识别算法
function detectInstitutionFromCertNo(certNo: string): string | null {
  const upperCertNo = certNo.toUpperCase().trim();

  // 中国机构
  if (upperCertNo.startsWith('NGTC') || upperCertNo.includes('国检'))
    return 'NGTC';
  if (upperCertNo.startsWith('GTC')) return 'GTC';
  if (upperCertNo.startsWith('CGL')) return 'CGL';
  if (upperCertNo.startsWith('NGDTC')) return 'NGDTC';

  // 国际机构
  if (/^\d{10}$/.test(upperCertNo)) return 'GIA'; // GIA是10位纯数字
  if (/^\d{9}$/.test(upperCertNo)) return 'IGI'; // IGI通常是9位数字
  if (upperCertNo.startsWith('HRD')) return 'HRD';
  if (upperCertNo.startsWith('AGS')) return 'AGS';
  if (upperCertNo.startsWith('GRS')) return 'GRS';
  if (upperCertNo.startsWith('SSEF')) return 'SSEF';
  if (upperCertNo.startsWith('GUILD')) return 'GUILD';

  return null;
}

// GET - 获取鉴定机构列表和证书知识
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'institutions') {
      // 从数据库获取机构列表
      let institutions: any[] = [];
      try {
        institutions = await db
          .select()
          .from(certInstitutions)
          .where(eq(certInstitutions.isActive, true))
          .orderBy(asc(certInstitutions.sortOrder));
      } catch (e) {
        console.log('数据库查询失败，使用备用数据');
      }

      // 如果数据库没有数据，使用备用数据
      if (institutions.length === 0) {
        institutions = fallbackInstitutions;
      }

      return NextResponse.json({
        success: true,
        data: institutions.map((inst) => ({
          id: inst.code?.toLowerCase() || inst.id,
          code: inst.code,
          name: inst.fullName || inst.name,
          shortName: inst.name,
          logo:
            inst.logo || `/images/institutions/${inst.code?.toLowerCase()}.png`,
          website: inst.website,
          description: inst.description,
          features: Array.isArray(inst.features)
            ? inst.features.map((f: any) => f.name || f)
            : [],
          queryUrl: inst.verifyUrl,
          authority: inst.authority,
          region: inst.region,
          country: inst.country,
          certTypes: inst.certTypes
        }))
      });
    }

    if (type === 'knowledge') {
      const category = searchParams.get('category');

      // 从数据库获取知识库
      let knowledge: any[] = [];
      try {
        if (category) {
          knowledge = await db
            .select()
            .from(certKnowledge)
            .where(eq(certKnowledge.category, category))
            .orderBy(asc(certKnowledge.sortOrder));
        } else {
          knowledge = await db
            .select()
            .from(certKnowledge)
            .where(eq(certKnowledge.isPublished, true))
            .orderBy(asc(certKnowledge.sortOrder));
        }
      } catch (e) {
        console.log('数据库查询失败，使用备用数据');
      }

      // 如果数据库没有数据，使用备用静态数据
      if (knowledge.length === 0) {
        const staticKnowledge = category
          ? certificateKnowledge.filter((k) => k.category === category)
          : certificateKnowledge;
        return NextResponse.json({
          success: true,
          data: staticKnowledge
        });
      }

      return NextResponse.json({
        success: true,
        data: knowledge.map((k) => ({
          id: k.id,
          title: k.title,
          category: k.category,
          icon: getCategoryIcon(k.category),
          content: k.content,
          summary: k.summary,
          tags: k.tags,
          viewCount: k.viewCount
        }))
      });
    }

    if (type === 'features') {
      // 获取证书图像识别特征
      const institutionCode = searchParams.get('institution');
      let features: any[] = [];

      try {
        if (institutionCode) {
          const [inst] = await db
            .select()
            .from(certInstitutions)
            .where(eq(certInstitutions.code, institutionCode.toUpperCase()))
            .limit(1);

          if (inst) {
            features = await db
              .select()
              .from(certImageFeatures)
              .where(eq(certImageFeatures.institutionId, inst.id));
          }
        }
      } catch (e) {
        console.log('获取特征数据失败');
      }

      return NextResponse.json({
        success: true,
        data: features
      });
    }

    // 默认返回所有数据
    let institutions: any[] = [];
    let knowledge: any[] = [];

    try {
      institutions = await db
        .select()
        .from(certInstitutions)
        .where(eq(certInstitutions.isActive, true))
        .orderBy(asc(certInstitutions.sortOrder));
      knowledge = await db
        .select()
        .from(certKnowledge)
        .where(eq(certKnowledge.isPublished, true))
        .orderBy(asc(certKnowledge.sortOrder));
    } catch (e) {
      institutions = fallbackInstitutions;
    }

    if (institutions.length === 0) institutions = fallbackInstitutions;
    if (knowledge.length === 0) knowledge = certificateKnowledge as any[];

    return NextResponse.json({
      success: true,
      data: {
        institutions: institutions.map((inst) => ({
          id: inst.code?.toLowerCase() || inst.id,
          code: inst.code,
          name: inst.fullName || inst.name,
          shortName: inst.name,
          website: inst.website,
          queryUrl: inst.verifyUrl,
          authority: inst.authority
        })),
        knowledge: knowledge.map((k) => ({
          id: k.id,
          title: k.title,
          category: k.category,
          icon: getCategoryIcon(k.category)
        }))
      }
    });
  } catch (error: any) {
    console.error('获取证书信息失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '获取证书信息失败' },
      { status: 500 }
    );
  }
}

// 根据分类获取图标
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    diamond: '💎',
    jade: '🟢',
    gold: '🥇',
    pearl: '🦪',
    gemstone: '💠',
    basics: '📚',
    identification: '🔍',
    faq: '❓',
    general: '📋'
  };
  return icons[category] || '📄';
}

// POST - 证书查询和AI解读
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, certificateNo, institution, question, imageUrl } = body;

    if (action === 'query') {
      // 证书查询
      if (!certificateNo) {
        return NextResponse.json(
          { success: false, message: '请输入证书编号' },
          { status: 400 }
        );
      }

      // 使用智能识别算法检测机构
      const detectedCode =
        institution?.toUpperCase() ||
        detectInstitutionFromCertNo(certificateNo);

      // 从数据库查询机构信息
      let inst: any = null;
      if (detectedCode) {
        try {
          const [dbInst] = await db
            .select()
            .from(certInstitutions)
            .where(eq(certInstitutions.code, detectedCode))
            .limit(1);
          inst = dbInst;
        } catch (e) {
          // 使用备用数据
          inst = fallbackInstitutions.find((i) => i.code === detectedCode);
        }
      }

      // 记录查询历史
      try {
        await db.insert(certVerifications).values({
          userId: user.id,
          institutionId: inst?.id || null,
          certNumber: certificateNo,
          verifyResult: 'pending'
        });
      } catch (e) {
        // 记录失败不影响主流程
      }

      return NextResponse.json({
        success: true,
        data: {
          certificateNo,
          detectedCode,
          institution: inst
            ? {
                id: inst.code?.toLowerCase(),
                code: inst.code,
                name: inst.fullName || inst.name,
                shortName: inst.name,
                website: inst.website,
                queryUrl: inst.verifyUrl,
                authority: inst.authority,
                description: inst.description
              }
            : null,
          queryUrl: inst?.verifyUrl || null,
          message: inst
            ? `检测到这是${inst.fullName || inst.name}(${inst.code})的证书，请点击下方链接前往官网查询验证`
            : '无法自动识别证书来源，建议手动选择鉴定机构或联系购买商家确认',
          tips: getVerificationTips(detectedCode)
        }
      });
    }

    if (action === 'interpret') {
      // AI证书解读
      if (!question) {
        return NextResponse.json(
          { success: false, message: '请输入您的问题' },
          { status: 400 }
        );
      }

      const systemPrompt = `你是一位资深的珠宝鉴定证书解读专家，拥有GIA、NGTC等多家权威机构的专业资质。
用户会向你咨询关于珠宝鉴定证书的问题。

请遵循以下原则：
1. 用通俗易懂的语言解答，避免过于专业的术语
2. 如果涉及具体数值或等级，请解释其含义和市场意义
3. 提醒用户注意可能的风险点
4. 如果用户描述的证书信息有异常，请明确指出
5. 回答要简洁有重点，控制在300字以内`;

      const reply = await zhipuAIService.chat([
        { role: 'user', content: `${systemPrompt}\n\n用户问题：${question}` }
      ]);

      return NextResponse.json({
        success: true,
        data: { reply }
      });
    }

    if (action === 'analyze-image') {
      // AI分析证书图片（预留接口）
      if (!imageUrl) {
        return NextResponse.json(
          { success: false, message: '请上传证书图片' },
          { status: 400 }
        );
      }

      // TODO: 集成图像识别API
      return NextResponse.json({
        success: true,
        data: {
          message: '图像分析功能正在开发中',
          detectedFeatures: []
        }
      });
    }

    return NextResponse.json(
      { success: false, message: '无效的操作类型' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('证书操作失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '操作失败' },
      { status: 500 }
    );
  }
}

// 获取验证提示
function getVerificationTips(institutionCode: string | null): string[] {
  const tips: string[] = [
    '请确保证书编号与实物激光刻字一致',
    '注意核对证书上的防伪特征'
  ];

  if (institutionCode === 'GIA') {
    tips.push('GIA钻石腰部应有激光刻字，可用10倍放大镜查看');
    tips.push('证书右上角应有全息防伪标签');
  } else if (institutionCode === 'NGTC') {
    tips.push('NGTC证书可通过官网或微信公众号查询');
    tips.push('注意检查证书上的CMA/CAL/CNAS认证标志');
  } else if (institutionCode === 'IGI') {
    tips.push('IGI证书可在官网输入编号查询');
  }

  return tips;
}
