import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// 贵金属实时价格数据（模拟数据，实际可接入第三方API）
const metalPrices = {
  gold: {
    name: '黄金',
    symbol: 'Au',
    unit: '元/克',
    prices: [
      {
        type: 'Au999',
        name: '足金999',
        price: 615.5,
        change: 2.3,
        changePercent: 0.38
      },
      {
        type: 'Au9999',
        name: '千足金9999',
        price: 616.8,
        change: 2.5,
        changePercent: 0.41
      },
      {
        type: 'Au750',
        name: '18K金',
        price: 461.6,
        change: 1.7,
        changePercent: 0.37
      },
      {
        type: 'Au585',
        name: '14K金',
        price: 360.1,
        change: 1.3,
        changePercent: 0.36
      }
    ],
    history: generatePriceHistory(615.5, 30)
  },
  silver: {
    name: '白银',
    symbol: 'Ag',
    unit: '元/克',
    prices: [
      {
        type: 'Ag999',
        name: '足银999',
        price: 7.85,
        change: 0.12,
        changePercent: 1.55
      },
      {
        type: 'Ag925',
        name: '925银',
        price: 7.26,
        change: 0.11,
        changePercent: 1.54
      }
    ],
    history: generatePriceHistory(7.85, 30)
  },
  platinum: {
    name: '铂金',
    symbol: 'Pt',
    unit: '元/克',
    prices: [
      {
        type: 'Pt999',
        name: '铂金999',
        price: 358.2,
        change: -1.8,
        changePercent: -0.5
      },
      {
        type: 'Pt950',
        name: '铂金950',
        price: 340.3,
        change: -1.7,
        changePercent: -0.5
      }
    ],
    history: generatePriceHistory(358.2, 30)
  },
  palladium: {
    name: '钯金',
    symbol: 'Pd',
    unit: '元/克',
    prices: [
      {
        type: 'Pd999',
        name: '钯金999',
        price: 312.5,
        change: 3.2,
        changePercent: 1.03
      }
    ],
    history: generatePriceHistory(312.5, 30)
  }
};

// 拍卖资讯数据
const auctionNews = [
  {
    id: 1,
    title: '佳士得香港春季珠宝拍卖',
    house: '佳士得',
    location: '香港',
    date: '2024-05-25',
    endDate: '2024-05-26',
    status: 'upcoming',
    highlights: ['稀有粉钻项链', '翡翠珍品', '古董珠宝'],
    imageUrl: '/images/auction/christies.jpg',
    description:
      '本次拍卖将呈献一系列珍稀珠宝，包括来自私人珍藏的顶级粉钻及翡翠臻品。',
    estimatedTotal: '预估总成交额：HKD 2-3亿'
  },
  {
    id: 2,
    title: '苏富比日内瓦珠宝专场',
    house: '苏富比',
    location: '日内瓦',
    date: '2024-06-10',
    endDate: '2024-06-11',
    status: 'upcoming',
    highlights: ['蓝宝石套装', '卡地亚古董', '祖母绿珍品'],
    imageUrl: '/images/auction/sothebys.jpg',
    description: '瑞士日内瓦高级珠宝专场拍卖，呈献来自欧洲贵族的传世珍藏。',
    estimatedTotal: '预估总成交额：CHF 5000万'
  },
  {
    id: 3,
    title: '保利北京翡翠珍品专场',
    house: '保利拍卖',
    location: '北京',
    date: '2024-04-15',
    endDate: '2024-04-15',
    status: 'completed',
    highlights: ['冰种满绿手镯', '帝王绿吊坠', '老坑玻璃种'],
    imageUrl: '/images/auction/poly.jpg',
    description: '本场拍卖成交额突破2亿元人民币，创下翡翠专场新纪录。',
    estimatedTotal: '成交总额：RMB 2.3亿',
    results: [
      { name: '冰种满绿手镯', price: 3800, unit: '万元' },
      { name: '帝王绿观音吊坠', price: 2200, unit: '万元' },
      { name: '老坑玻璃种蛋面戒指', price: 1580, unit: '万元' }
    ]
  }
];

// 品牌数据
const brands = [
  {
    id: 'cartier',
    name: '卡地亚',
    nameEn: 'Cartier',
    country: '法国',
    founded: 1847,
    logo: '/images/brands/cartier.png',
    description:
      '卡地亚是法国著名奢侈品品牌，被誉为"皇帝的珠宝商，珠宝商的皇帝"。',
    specialties: ['高级珠宝', '腕表', '皮具'],
    priceRange: '¥5,000 - ¥50,000,000+',
    website: 'https://www.cartier.com',
    stores: [
      { city: '上海', address: '南京西路恒隆广场', phone: '021-62880000' },
      { city: '北京', address: 'SKP购物中心', phone: '010-65888000' },
      { city: '深圳', address: '万象城', phone: '0755-82888000' }
    ]
  },
  {
    id: 'tiffany',
    name: '蒂芙尼',
    nameEn: 'Tiffany & Co.',
    country: '美国',
    founded: 1837,
    logo: '/images/brands/tiffany.png',
    description:
      '蒂芙尼是全球著名的珠宝和银饰品牌，以其标志性的蓝色包装盒闻名。',
    specialties: ['钻石订婚戒指', '银饰', '高级珠宝'],
    priceRange: '¥2,000 - ¥30,000,000+',
    website: 'https://www.tiffany.com',
    stores: [
      { city: '上海', address: '国金中心IFC', phone: '021-50128000' },
      { city: '北京', address: '国贸商城', phone: '010-65058000' },
      { city: '成都', address: 'IFS国际金融中心', phone: '028-86508000' }
    ]
  },
  {
    id: 'bulgari',
    name: '宝格丽',
    nameEn: 'BVLGARI',
    country: '意大利',
    founded: 1884,
    logo: '/images/brands/bulgari.png',
    description: '宝格丽是意大利奢侈品牌，以大胆的设计和彩色宝石闻名于世。',
    specialties: ['彩色宝石', 'Serpenti系列', '高级珠宝'],
    priceRange: '¥8,000 - ¥80,000,000+',
    website: 'https://www.bulgari.com',
    stores: [
      { city: '上海', address: '恒隆广场', phone: '021-62880088' },
      { city: '北京', address: '王府半岛酒店', phone: '010-65128088' },
      { city: '杭州', address: '湖滨银泰in77', phone: '0571-87808088' }
    ]
  },
  {
    id: 'vancleef',
    name: '梵克雅宝',
    nameEn: 'Van Cleef & Arpels',
    country: '法国',
    founded: 1906,
    logo: '/images/brands/vancleef.png',
    description: '梵克雅宝以诗意的设计和精湛的工艺著称，四叶草系列深受喜爱。',
    specialties: ['Alhambra四叶草', '隐秘镶嵌', '高级珠宝'],
    priceRange: '¥15,000 - ¥100,000,000+',
    website: 'https://www.vancleefarpels.com',
    stores: [
      { city: '上海', address: '恒隆广场', phone: '021-62889999' },
      { city: '北京', address: 'SKP购物中心', phone: '010-65889999' }
    ]
  },
  {
    id: 'chow_tai_fook',
    name: '周大福',
    nameEn: 'Chow Tai Fook',
    country: '中国',
    founded: 1929,
    logo: '/images/brands/chowtaifook.png',
    description: '周大福是中国最大的珠宝零售商之一，以黄金和翡翠产品著称。',
    specialties: ['足金饰品', '翡翠', '钻石'],
    priceRange: '¥500 - ¥5,000,000+',
    website: 'https://www.ctf.com.cn',
    stores: [{ city: '全国', address: '超过4000家门店', phone: '400-188-9999' }]
  },
  {
    id: 'lao_feng_xiang',
    name: '老凤祥',
    nameEn: 'Lao Feng Xiang',
    country: '中国',
    founded: 1848,
    logo: '/images/brands/laofengxiang.png',
    description: '老凤祥是中国历史最悠久的珠宝品牌之一，以传统金银饰品闻名。',
    specialties: ['传统金饰', '银饰', '珐琅工艺'],
    priceRange: '¥300 - ¥1,000,000+',
    website: 'https://www.laofengxiang.com',
    stores: [{ city: '全国', address: '超过3000家门店', phone: '400-820-1848' }]
  }
];

// 新品发布
const newReleases = [
  {
    id: 1,
    brand: 'cartier',
    brandName: '卡地亚',
    name: 'Clash de Cartier 2024春季系列',
    releaseDate: '2024-03-01',
    description: '全新Clash系列延续标志性的铆钉设计，新增玫瑰金配色。',
    imageUrl: '/images/releases/cartier-clash-2024.jpg',
    priceRange: '¥25,000 - ¥150,000',
    highlights: ['18K玫瑰金', '钻石镶嵌', '可调节设计']
  },
  {
    id: 2,
    brand: 'tiffany',
    brandName: '蒂芙尼',
    name: 'Tiffany Lock 2024限定款',
    releaseDate: '2024-02-14',
    description: '情人节特别限定款Lock系列，象征爱的承诺。',
    imageUrl: '/images/releases/tiffany-lock-2024.jpg',
    priceRange: '¥18,000 - ¥88,000',
    highlights: ['玫瑰金', '白金', '钻石款']
  },
  {
    id: 3,
    brand: 'bulgari',
    brandName: '宝格丽',
    name: 'Serpenti Viper 高级珠宝系列',
    releaseDate: '2024-04-01',
    description: '全新蛇形高级珠宝系列，展现大胆与优雅。',
    imageUrl: '/images/releases/bulgari-serpenti-2024.jpg',
    priceRange: '¥80,000 - ¥2,000,000',
    highlights: ['钻石密镶', '祖母绿眼睛', '可转换设计']
  }
];

// 生成价格历史数据
function generatePriceHistory(basePrice: number, days: number) {
  const history = [];
  const now = new Date();
  let price = basePrice * 0.95;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.48) * basePrice * 0.02;
    price = Math.max(
      basePrice * 0.9,
      Math.min(basePrice * 1.1, price + change)
    );

    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2))
    });
  }

  return history;
}

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

    switch (type) {
      case 'prices':
        const metal = searchParams.get('metal');
        if (metal && metalPrices[metal as keyof typeof metalPrices]) {
          return NextResponse.json({
            success: true,
            data: metalPrices[metal as keyof typeof metalPrices]
          });
        }
        return NextResponse.json({
          success: true,
          data: metalPrices
        });

      case 'auctions':
        const status = searchParams.get('status');
        const filteredAuctions = status
          ? auctionNews.filter((a) => a.status === status)
          : auctionNews;
        return NextResponse.json({
          success: true,
          data: filteredAuctions
        });

      case 'brands':
        const brandId = searchParams.get('id');
        if (brandId) {
          const brand = brands.find((b) => b.id === brandId);
          return NextResponse.json({
            success: true,
            data: brand || null
          });
        }
        return NextResponse.json({
          success: true,
          data: brands
        });

      case 'releases':
        const brandFilter = searchParams.get('brand');
        const filteredReleases = brandFilter
          ? newReleases.filter((r) => r.brand === brandFilter)
          : newReleases;
        return NextResponse.json({
          success: true,
          data: filteredReleases
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            prices: Object.keys(metalPrices).map((key) => ({
              id: key,
              ...metalPrices[key as keyof typeof metalPrices],
              history: undefined
            })),
            auctions: auctionNews.slice(0, 3),
            brands: brands.slice(0, 4),
            releases: newReleases.slice(0, 3)
          }
        });
    }
  } catch (error: any) {
    console.error('获取市场数据失败:', error);
    return NextResponse.json(
      { success: false, message: error.message || '获取数据失败' },
      { status: 500 }
    );
  }
}
