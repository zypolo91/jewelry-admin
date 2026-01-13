import { db } from '../src/db';
import { jewelryCategories, purchaseChannels } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const defaultCategories = [
  { name: '松石', sortOrder: 1 },
  { name: '翡翠', sortOrder: 2 },
  { name: '蜜蜡/琥珀', sortOrder: 3 },
  { name: '南红', sortOrder: 4 },
  { name: '银饰', sortOrder: 5 },
  { name: '黄金', sortOrder: 6 },
  { name: '其他', sortOrder: 7 }
];

const defaultChannels = [
  { name: '抖音直播', sortOrder: 1 },
  { name: '小红书', sortOrder: 2 },
  { name: '闲鱼', sortOrder: 3 },
  { name: '淘宝/天猫', sortOrder: 4 },
  { name: '实体店', sortOrder: 5 },
  { name: '朋友转让', sortOrder: 6 },
  { name: '其他', sortOrder: 7 }
];

async function seedDefaults() {
  console.log('🌱 开始初始化系统默认数据...\n');

  try {
    // 检查并插入默认分类
    console.log('📦 检查默认分类...');
    for (const category of defaultCategories) {
      const existing = await db
        .select()
        .from(jewelryCategories)
        .where(eq(jewelryCategories.name, category.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(jewelryCategories).values({
          name: category.name,
          sortOrder: category.sortOrder,
          isSystem: true,
          userId: null
        });
        console.log(`  ✓ 创建分类: ${category.name}`);
      } else {
        console.log(`  - 分类已存在: ${category.name}`);
      }
    }

    // 检查并插入默认渠道
    console.log('\n🏪 检查默认渠道...');
    for (const channel of defaultChannels) {
      const existing = await db
        .select()
        .from(purchaseChannels)
        .where(eq(purchaseChannels.name, channel.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(purchaseChannels).values({
          name: channel.name,
          sortOrder: channel.sortOrder,
          isSystem: true,
          userId: null
        });
        console.log(`  ✓ 创建渠道: ${channel.name}`);
      } else {
        console.log(`  - 渠道已存在: ${channel.name}`);
      }
    }

    console.log('\n✅ 系统默认数据初始化完成！');
    console.log('\n📊 统计信息:');

    const totalCategories: any[] = await db.select().from(jewelryCategories);
    const systemCategories = totalCategories.filter((c: any) => c.isSystem);
    console.log(`  - 总分类数: ${totalCategories.length}`);
    console.log(`  - 系统分类: ${systemCategories.length}`);

    const totalChannels: any[] = await db.select().from(purchaseChannels);
    const systemChannels = totalChannels.filter((c: any) => c.isSystem);
    console.log(`  - 总渠道数: ${totalChannels.length}`);
    console.log(`  - 系统渠道: ${systemChannels.length}`);
  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedDefaults();
