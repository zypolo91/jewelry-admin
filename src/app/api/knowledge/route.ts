import { NextRequest, NextResponse } from 'next/server';
import {
  jewelryKnowledgeTips,
  classicJewelryDesigns
} from '@/scripts/seed-jewelry-knowledge';

/**
 * 珠宝小知识和经典设计 API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const level = searchParams.get('level');
  const random = searchParams.get('random');
  const limit = parseInt(searchParams.get('limit') || '10');

  // 获取珠宝小知识
  if (type === 'tips') {
    let allTips: any[] = [];

    // 展开所有tips
    jewelryKnowledgeTips.forEach((cat) => {
      cat.tips.forEach((tip) => {
        allTips.push({
          ...tip,
          category: cat.category,
          categoryName: cat.categoryName,
          icon: cat.icon
        });
      });
    });

    // 按分类筛选
    if (category) {
      allTips = allTips.filter((t) => t.category === category);
    }

    // 按难度筛选
    if (level) {
      allTips = allTips.filter((t) => t.level === level);
    }

    // 随机排序
    if (random === 'true') {
      allTips = allTips.sort(() => Math.random() - 0.5);
    }

    // 限制数量
    allTips = allTips.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: allTips,
      total: allTips.length,
      categories: jewelryKnowledgeTips.map((c) => ({
        id: c.category,
        name: c.categoryName,
        icon: c.icon,
        count: c.tips.length
      }))
    });
  }

  // 获取知识分类列表
  if (type === 'categories') {
    return NextResponse.json({
      success: true,
      data: jewelryKnowledgeTips.map((c) => ({
        id: c.category,
        name: c.categoryName,
        icon: c.icon,
        count: c.tips.length,
        preview: c.tips.slice(0, 2).map((t) => t.title)
      }))
    });
  }

  // 获取每日知识（随机一条）
  if (type === 'daily') {
    const allTips: any[] = [];
    jewelryKnowledgeTips.forEach((cat) => {
      cat.tips.forEach((tip) => {
        allTips.push({
          ...tip,
          category: cat.category,
          categoryName: cat.categoryName,
          icon: cat.icon
        });
      });
    });

    // 基于日期的伪随机选择
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000
    );
    const index = dayOfYear % allTips.length;

    return NextResponse.json({
      success: true,
      data: allTips[index],
      date: today.toISOString().split('T')[0]
    });
  }

  // 获取经典设计
  if (type === 'designs') {
    let designs: any[] = [];

    if (category) {
      const cat = classicJewelryDesigns.find((c) => c.category === category);
      if (cat) {
        designs = cat.designs.map((d) => ({
          ...d,
          category: cat.category,
          categoryName: cat.categoryName
        }));
      }
    } else {
      // 返回所有设计
      classicJewelryDesigns.forEach((cat) => {
        cat.designs.forEach((design) => {
          designs.push({
            ...design,
            category: cat.category,
            categoryName: cat.categoryName
          });
        });
      });
    }

    // 随机排序
    if (random === 'true') {
      designs = designs.sort(() => Math.random() - 0.5);
    }

    // 限制数量
    designs = designs.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: designs,
      total: designs.length,
      categories: classicJewelryDesigns.map((c) => ({
        id: c.category,
        name: c.categoryName,
        count: c.designs.length
      }))
    });
  }

  // 获取设计分类
  if (type === 'design-categories') {
    return NextResponse.json({
      success: true,
      data: classicJewelryDesigns.map((c) => ({
        id: c.category,
        name: c.categoryName,
        count: c.designs.length,
        preview: c.designs.slice(0, 2).map((d) => d.name)
      }))
    });
  }

  // 默认返回概览
  return NextResponse.json({
    success: true,
    data: {
      tipCategories: jewelryKnowledgeTips.length,
      totalTips: jewelryKnowledgeTips.reduce(
        (sum, c) => sum + c.tips.length,
        0
      ),
      designCategories: classicJewelryDesigns.length,
      totalDesigns: classicJewelryDesigns.reduce(
        (sum, c) => sum + c.designs.length,
        0
      )
    },
    endpoints: [
      'GET /api/knowledge?type=tips - 获取珠宝小知识',
      'GET /api/knowledge?type=tips&category=diamond - 按分类获取',
      'GET /api/knowledge?type=tips&random=true&limit=5 - 随机获取',
      'GET /api/knowledge?type=daily - 每日知识',
      'GET /api/knowledge?type=categories - 知识分类列表',
      'GET /api/knowledge?type=designs - 经典设计',
      'GET /api/knowledge?type=designs&category=ring - 按分类获取设计',
      'GET /api/knowledge?type=design-categories - 设计分类列表'
    ]
  });
}
