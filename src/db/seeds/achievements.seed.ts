import { db } from '../index';
import { achievements, levelConfig, themes, topics } from '../schema';

export async function seedAchievements() {
  console.log('Seeding achievements...');

  const achievementData = [
    // 收藏成就
    {
      code: 'first_jewelry',
      name: '初入门道',
      description: '录入第一件珠宝',
      category: 'collection',
      conditionType: 'jewelry_count',
      conditionValue: 1,
      points: 10,
      rarity: 'common',
      sortOrder: 1
    },
    {
      code: 'collector_10',
      name: '小有收获',
      description: '收藏达到10件',
      category: 'collection',
      conditionType: 'jewelry_count',
      conditionValue: 10,
      points: 20,
      rarity: 'common',
      sortOrder: 2
    },
    {
      code: 'collector_50',
      name: '收藏达人',
      description: '收藏达到50件',
      category: 'collection',
      conditionType: 'jewelry_count',
      conditionValue: 50,
      points: 50,
      rarity: 'rare',
      sortOrder: 3
    },
    {
      code: 'collector_100',
      name: '百宝箱',
      description: '收藏达到100件',
      category: 'collection',
      conditionType: 'jewelry_count',
      conditionValue: 100,
      points: 100,
      rarity: 'epic',
      sortOrder: 4
    },
    {
      code: 'collector_500',
      name: '珠宝大亨',
      description: '收藏达到500件',
      category: 'collection',
      conditionType: 'jewelry_count',
      conditionValue: 500,
      points: 200,
      rarity: 'legendary',
      sortOrder: 5
    },

    // 价值成就
    {
      code: 'value_10k',
      name: '小有积蓄',
      description: '总价值达到1万',
      category: 'value',
      conditionType: 'total_value',
      conditionValue: 10000,
      points: 30,
      rarity: 'common',
      sortOrder: 10
    },
    {
      code: 'value_100k',
      name: '身家不菲',
      description: '总价值达到10万',
      category: 'value',
      conditionType: 'total_value',
      conditionValue: 100000,
      points: 100,
      rarity: 'rare',
      sortOrder: 11
    },
    {
      code: 'value_1m',
      name: '富甲一方',
      description: '总价值达到100万',
      category: 'value',
      conditionType: 'total_value',
      conditionValue: 1000000,
      points: 300,
      rarity: 'legendary',
      sortOrder: 12
    },

    // 活跃成就
    {
      code: 'daily_check_7',
      name: '坚持不懈',
      description: '连续签到7天',
      category: 'activity',
      conditionType: 'daily_check_streak',
      conditionValue: 7,
      points: 30,
      rarity: 'common',
      sortOrder: 20
    },
    {
      code: 'daily_check_30',
      name: '持之以恒',
      description: '连续签到30天',
      category: 'activity',
      conditionType: 'daily_check_streak',
      conditionValue: 30,
      points: 100,
      rarity: 'rare',
      sortOrder: 21
    },
    {
      code: 'daily_check_100',
      name: '铁杆粉丝',
      description: '连续签到100天',
      category: 'activity',
      conditionType: 'daily_check_streak',
      conditionValue: 100,
      points: 300,
      rarity: 'epic',
      sortOrder: 22
    },

    // 社交成就
    {
      code: 'share_first',
      name: '分享达人',
      description: '首次分享藏品',
      category: 'social',
      conditionType: 'share_count',
      conditionValue: 1,
      points: 10,
      rarity: 'common',
      sortOrder: 30
    },
    {
      code: 'post_first',
      name: '初露锋芒',
      description: '发布第一条动态',
      category: 'social',
      conditionType: 'post_count',
      conditionValue: 1,
      points: 10,
      rarity: 'common',
      sortOrder: 31
    },
    {
      code: 'follower_10',
      name: '小有名气',
      description: '获得10个粉丝',
      category: 'social',
      conditionType: 'follower_count',
      conditionValue: 10,
      points: 50,
      rarity: 'rare',
      sortOrder: 32
    },

    // AI成就
    {
      code: 'ai_valuation_first',
      name: 'AI初体验',
      description: '首次使用AI估价',
      category: 'ai',
      conditionType: 'ai_valuation_count',
      conditionValue: 1,
      points: 10,
      rarity: 'common',
      sortOrder: 40
    },
    {
      code: 'ai_auth_first',
      name: '火眼金睛',
      description: '首次使用AI鉴定',
      category: 'ai',
      conditionType: 'ai_auth_count',
      conditionValue: 1,
      points: 10,
      rarity: 'common',
      sortOrder: 41
    }
  ];

  for (const data of achievementData) {
    await db.insert(achievements).values(data).onConflictDoNothing();
  }

  console.log('Achievements seeded successfully!');
}

export async function seedLevelConfig() {
  console.log('Seeding level config...');

  const levels = [
    {
      level: 1,
      title: '收藏新手',
      expRequired: 0,
      privileges: { ai_quota: 5 }
    },
    {
      level: 2,
      title: '珠宝爱好者',
      expRequired: 100,
      privileges: { ai_quota: 10 }
    },
    {
      level: 3,
      title: '收藏达人',
      expRequired: 500,
      privileges: { ai_quota: 20, themes: ['gold'] }
    },
    {
      level: 4,
      title: '鉴赏专家',
      expRequired: 2000,
      privileges: { ai_quota: 50, themes: ['gold', 'jade'] }
    },
    {
      level: 5,
      title: '珠宝大师',
      expRequired: 10000,
      privileges: { ai_quota: 100, themes: 'all', badge: 'master' }
    }
  ];

  for (const data of levels) {
    await db.insert(levelConfig).values(data).onConflictDoNothing();
  }

  console.log('Level config seeded successfully!');
}

export async function seedThemes() {
  console.log('Seeding themes...');

  const themeData = [
    {
      code: 'default',
      name: '默认主题',
      description: '简洁优雅的默认主题',
      colors: { primary: '#1976D2', secondary: '#424242' },
      isVip: false,
      sortOrder: 1
    },
    {
      code: 'gold',
      name: '金色年华',
      description: '奢华金色主题',
      colors: { primary: '#FFD700', secondary: '#B8860B' },
      isVip: true,
      sortOrder: 2
    },
    {
      code: 'jade',
      name: '翡翠绿韵',
      description: '清新翡翠绿主题',
      colors: { primary: '#00A86B', secondary: '#228B22' },
      isVip: true,
      sortOrder: 3
    },
    {
      code: 'ruby',
      name: '红宝石',
      description: '热情红宝石主题',
      colors: { primary: '#E0115F', secondary: '#9B111E' },
      isVip: true,
      sortOrder: 4
    },
    {
      code: 'sapphire',
      name: '蓝宝石',
      description: '深邃蓝宝石主题',
      colors: { primary: '#0F52BA', secondary: '#082567' },
      isVip: true,
      sortOrder: 5
    },
    {
      code: 'dark',
      name: '暗夜模式',
      description: '护眼暗色主题',
      colors: { primary: '#BB86FC', secondary: '#03DAC6' },
      isVip: false,
      sortOrder: 6
    }
  ];

  for (const data of themeData) {
    await db.insert(themes).values(data).onConflictDoNothing();
  }

  console.log('Themes seeded successfully!');
}

export async function seedTopics() {
  console.log('Seeding topics...');

  const topicData = [
    {
      name: '新手入门',
      description: '珠宝收藏入门知识',
      icon: '📚',
      color: '#4CAF50',
      sortOrder: 1
    },
    {
      name: '鉴定交流',
      description: '珠宝鉴定经验分享',
      icon: '🔍',
      color: '#2196F3',
      sortOrder: 2
    },
    {
      name: '市场行情',
      description: '珠宝市场价格动态',
      icon: '📈',
      color: '#FF9800',
      sortOrder: 3
    },
    {
      name: '保养心得',
      description: '珠宝保养技巧分享',
      icon: '💎',
      color: '#9C27B0',
      sortOrder: 4
    },
    {
      name: '晒单分享',
      description: '晒出你的宝贝',
      icon: '📷',
      color: '#E91E63',
      sortOrder: 5
    },
    {
      name: '求购转让',
      description: '珠宝买卖信息',
      icon: '🤝',
      color: '#607D8B',
      sortOrder: 6
    }
  ];

  for (const data of topicData) {
    await db.insert(topics).values(data).onConflictDoNothing();
  }

  console.log('Topics seeded successfully!');
}

export async function runAllSeeds() {
  await seedAchievements();
  await seedLevelConfig();
  await seedThemes();
  await seedTopics();
  console.log('All seeds completed!');
}
