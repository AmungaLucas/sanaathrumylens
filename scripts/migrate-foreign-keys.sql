-- ============================================
-- Migration: Add Foreign Key Constraints
-- Run AFTER InnoDB migration
-- ============================================

ALTER TABLE posts ADD CONSTRAINT fk_posts_author
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL;

ALTER TABLE comments ADD CONSTRAINT fk_comments_post
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE comments ADD CONSTRAINT fk_comments_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE comments ADD CONSTRAINT fk_comments_parent
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT fk_postlikes_post
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT fk_postlikes_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE comment_likes ADD CONSTRAINT fk_commentlikes_comment
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;

ALTER TABLE comment_likes ADD CONSTRAINT fk_commentlikes_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE bookmarks ADD CONSTRAINT fk_bookmarks_post
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE bookmarks ADD CONSTRAINT fk_bookmarks_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE comment_reports ADD CONSTRAINT fk_reports_comment
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;

ALTER TABLE comment_reports ADD CONSTRAINT fk_reports_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
