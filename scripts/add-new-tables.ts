import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { getDatabaseDialect } from '../src/db/dialect';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function addNewTables() {
  const dialect = getDatabaseDialect();

  console.log(`🔧 使用数据库类型: ${dialect}`);
  console.log('📦 开始添加新表和字段...\n');

  try {
    if (dialect === 'postgres') {
      // PostgreSQL
      console.log('创建 favorites 表...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS favorites (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('为 posts 表添加 favorite_count 字段...');
      await db.execute(sql`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0
      `);

      console.log('为 messages 表添加 type 字段...');
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text'
      `);

      console.log('创建索引...');
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_favorites_post_id ON favorites(post_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_favorites_user_post ON favorites(user_id, post_id)
      `);
    } else {
      // MySQL
      console.log('创建 favorites 表...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS favorites (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          post_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('为 posts 表添加 favorite_count 字段...');
      await db.execute(sql`
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS favorite_count INT DEFAULT 0
      `);

      console.log('为 messages 表添加 type 字段...');
      await db.execute(sql`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text'
      `);

      console.log('创建索引...');
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_favorites_post_id ON favorites(post_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_favorites_user_post ON favorites(user_id, post_id)
      `);
    }

    console.log('\n✅ 所有新表和字段添加成功！');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 添加失败:', error.message);
    process.exit(1);
  }
}

addNewTables();
