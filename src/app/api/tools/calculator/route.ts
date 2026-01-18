import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// 金价计算器 - 根据重量和纯度计算金饰价格
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
    const { type, ...params } = body;

    let result;
    switch (type) {
      case 'gold':
        result = calculateGoldPrice(params);
        break;
      case 'diamond':
        result = calculateDiamondPrice(params);
        break;
      case 'currency':
        result = convertCurrency(params);
        break;
      default:
        return NextResponse.json(
          { success: false, message: '不支持的计算类型' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('计算失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '计算失败' },
      { status: 500 }
    );
  }
}

// 金价计算
function calculateGoldPrice(params: {
  weight: number; // 重量(克)
  purity: string; // 纯度: '999', '990', '916', '750', '585', '375'
  goldPrice: number; // 当日金价(元/克)
  laborFee?: number; // 工费(元/克)
  laborType?: string; // 工费类型: 'per_gram', 'fixed', 'percent'
  fixedLabor?: number; // 固定工费
}) {
  const {
    weight,
    purity,
    goldPrice,
    laborFee = 0,
    laborType = 'per_gram',
    fixedLabor = 0
  } = params;

  // 纯度系数
  const purityMap: Record<string, number> = {
    '999': 0.999, // 足金
    '990': 0.99, // 足金990
    '916': 0.916, // 22K金
    '750': 0.75, // 18K金
    '585': 0.585, // 14K金
    '375': 0.375 // 9K金
  };

  const purityFactor = purityMap[purity] || 0.999;
  const goldValue = weight * goldPrice * purityFactor;

  // 计算工费
  let laborCost = 0;
  switch (laborType) {
    case 'per_gram':
      laborCost = weight * laborFee;
      break;
    case 'fixed':
      laborCost = fixedLabor;
      break;
    case 'percent':
      laborCost = goldValue * (laborFee / 100);
      break;
  }

  const totalPrice = goldValue + laborCost;

  return {
    goldValue: Math.round(goldValue * 100) / 100,
    laborCost: Math.round(laborCost * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    purityFactor,
    breakdown: {
      weight,
      purity,
      goldPrice,
      effectiveGoldWeight: Math.round(weight * purityFactor * 1000) / 1000
    }
  };
}

// 钻石估价 (基于4C标准)
function calculateDiamondPrice(params: {
  carat: number; // 克拉数
  cut: string; // 切工: 'EX', 'VG', 'G', 'F', 'P'
  color: string; // 颜色: 'D'-'Z'
  clarity: string; // 净度: 'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'
  shape?: string; // 形状: 'round', 'princess', 'oval', 'cushion', 'emerald', 'pear', 'marquise', 'radiant'
}) {
  const { carat, cut, color, clarity, shape = 'round' } = params;

  // 基准价格表 (每克拉美元，简化版)
  const basePricePerCarat: Record<string, number> = {
    '0.3': 1500,
    '0.5': 2500,
    '0.7': 4000,
    '1.0': 7000,
    '1.5': 12000,
    '2.0': 20000,
    '3.0': 35000
  };

  // 找到最接近的基准价格
  let basePrice = 7000; // 默认1克拉价格
  const caratKeys = Object.keys(basePricePerCarat)
    .map(Number)
    .sort((a, b) => a - b);
  for (let i = 0; i < caratKeys.length; i++) {
    if (carat <= caratKeys[i]) {
      basePrice = basePricePerCarat[caratKeys[i].toString()];
      break;
    }
    if (i === caratKeys.length - 1) {
      basePrice = basePricePerCarat[caratKeys[i].toString()];
    }
  }

  // 切工系数
  const cutMultiplier: Record<string, number> = {
    EX: 1.15, // Excellent
    VG: 1.0, // Very Good
    G: 0.9, // Good
    F: 0.75, // Fair
    P: 0.5 // Poor
  };

  // 颜色系数 (D最好，依次递减)
  const colorGrades = [
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z'
  ];
  const colorIndex = colorGrades.indexOf(color.toUpperCase());
  const colorMultiplier = colorIndex >= 0 ? 1 - colorIndex * 0.03 : 1;

  // 净度系数
  const clarityMultiplier: Record<string, number> = {
    FL: 1.3, // Flawless
    IF: 1.2, // Internally Flawless
    VVS1: 1.1,
    VVS2: 1.05,
    VS1: 1.0,
    VS2: 0.95,
    SI1: 0.85,
    SI2: 0.75,
    I1: 0.5,
    I2: 0.35,
    I3: 0.2
  };

  // 形状系数 (圆形最贵)
  const shapeMultiplier: Record<string, number> = {
    round: 1.0,
    princess: 0.85,
    oval: 0.85,
    cushion: 0.8,
    emerald: 0.75,
    pear: 0.8,
    marquise: 0.75,
    radiant: 0.8
  };

  const cutFactor = cutMultiplier[cut] || 1;
  const clarityFactor = clarityMultiplier[clarity] || 1;
  const shapeFactor = shapeMultiplier[shape] || 1;

  const estimatedPriceUSD =
    basePrice *
    carat *
    cutFactor *
    colorMultiplier *
    clarityFactor *
    shapeFactor;
  const estimatedPriceCNY = estimatedPriceUSD * 7.2; // 汇率

  return {
    estimatedPriceUSD: Math.round(estimatedPriceUSD),
    estimatedPriceCNY: Math.round(estimatedPriceCNY),
    priceRange: {
      lowUSD: Math.round(estimatedPriceUSD * 0.8),
      highUSD: Math.round(estimatedPriceUSD * 1.2),
      lowCNY: Math.round(estimatedPriceCNY * 0.8),
      highCNY: Math.round(estimatedPriceCNY * 1.2)
    },
    factors: {
      carat,
      cut: { grade: cut, multiplier: cutFactor },
      color: {
        grade: color,
        multiplier: Math.round(colorMultiplier * 100) / 100
      },
      clarity: { grade: clarity, multiplier: clarityFactor },
      shape: { type: shape, multiplier: shapeFactor }
    },
    note: '此估价仅供参考，实际价格受市场供需、品牌溢价、证书等因素影响'
  };
}

// 货币换算
function convertCurrency(params: { amount: number; from: string; to: string }) {
  const { amount, from, to } = params;

  // 汇率表 (相对于CNY)
  const rates: Record<string, number> = {
    CNY: 1,
    USD: 7.2,
    EUR: 7.8,
    GBP: 9.1,
    JPY: 0.048,
    HKD: 0.92,
    CHF: 8.2,
    AUD: 4.7,
    CAD: 5.3,
    SGD: 5.4
  };

  if (!rates[from] || !rates[to]) {
    throw new Error('不支持的货币类型');
  }

  const amountInCNY = amount * rates[from];
  const result = amountInCNY / rates[to];

  return {
    originalAmount: amount,
    originalCurrency: from,
    convertedAmount: Math.round(result * 100) / 100,
    targetCurrency: to,
    rate: Math.round((rates[from] / rates[to]) * 10000) / 10000,
    note: '汇率仅供参考，实际交易以银行牌价为准'
  };
}

// 获取当前金价参考
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      );
    }

    // 模拟金价数据 (实际应接入实时API)
    const goldPrices = {
      updateTime: new Date().toISOString(),
      prices: {
        AU999: { buy: 580, sell: 582, unit: '元/克', name: '足金999' },
        AU990: { buy: 575, sell: 577, unit: '元/克', name: '足金990' },
        AU916: { buy: 530, sell: 532, unit: '元/克', name: '22K金' },
        AU750: { buy: 435, sell: 437, unit: '元/克', name: '18K金' },
        PT999: { buy: 210, sell: 212, unit: '元/克', name: '铂金999' },
        AG999: { buy: 5.8, sell: 6.0, unit: '元/克', name: '白银999' }
      },
      international: {
        gold: { price: 2050, unit: '美元/盎司', change: '+12.5' },
        silver: { price: 24.5, unit: '美元/盎司', change: '+0.3' },
        platinum: { price: 980, unit: '美元/盎司', change: '-5.2' }
      }
    };

    return NextResponse.json({ success: true, data: goldPrices });
  } catch (error: any) {
    console.error('获取金价失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '获取金价失败' },
      { status: 500 }
    );
  }
}
