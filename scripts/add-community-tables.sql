-- 社区功能新增表迁移脚本
-- 执行方式: 在数据库客户端中直接执行此SQL

-- 1. 用户拉黑表
CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  blocker_id INTEGER NOT NULL,
  blocked_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);

-- 2. 搜索关键词统计表
CREATE TABLE IF NOT EXISTS search_keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(100) NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引以提高热门搜索查询性能
CREATE INDEX IF NOT EXISTS idx_search_keywords_count ON search_keywords(search_count DESC);

-- 3. 确保 comments 表有 status 字段（用于隐藏/删除功能）
-- 如果字段不存在则添加
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'status'
  ) THEN
    ALTER TABLE comments ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  END IF;
END $$;

-- 4. 确保 likes 表支持评论点赞（检查现有结构）
-- likes 表应该已经有 target_type 和 target_id 字段
-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_target ON likes(user_id, target_type, target_id);

-- 5. 插入一些默认热门搜索词（可选）
INSERT INTO search_keywords (keyword, search_count) VALUES
  ('翡翠', 1200),
  ('钻石', 980),
  ('黄金', 850),
  ('珍珠', 720),
  ('蓝宝石', 650),
  ('红宝石', 580),
  ('和田玉', 520),
  ('祖母绿', 480)
ON CONFLICT (keyword) DO NOTHING;

-- 完成提示
SELECT '迁移完成！新增表: blocks, search_keywords' AS message;
