-- 添加收藏表 (PostgreSQL)
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 为posts表添加favorite_count字段
ALTER TABLE posts ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;

-- 为messages表添加type字段
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_post_id ON favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_post ON favorites(user_id, post_id);

-- 注意：如果使用MySQL，请使用以下语句替代：
-- CREATE TABLE IF NOT EXISTS favorites (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   user_id INT NOT NULL,
--   post_id INT NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- 
-- ALTER TABLE posts ADD COLUMN favorite_count INT DEFAULT 0;
-- ALTER TABLE messages ADD COLUMN type VARCHAR(20) DEFAULT 'text';
