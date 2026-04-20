-- ============================================
-- Migration: MyISAM to InnoDB
-- Run this script BEFORE adding foreign keys
-- ============================================

ALTER TABLE authors ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE users ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE posts ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE comments ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE events ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE categories ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE subscribers ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE post_likes ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE comment_likes ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE bookmarks ENGINE=InnoDB ROW_FORMAT=Dynamic;
ALTER TABLE comment_reports ENGINE=InnoDB ROW_FORMAT=Dynamic;
