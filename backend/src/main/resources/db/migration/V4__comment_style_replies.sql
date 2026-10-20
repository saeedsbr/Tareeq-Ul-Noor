-- Replies can now come from any member of the same gender group, not only the administrator.
ALTER TABLE question_replies RENAME COLUMN admin_user_id TO user_id;
ALTER TABLE question_replies ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'VISIBLE';
