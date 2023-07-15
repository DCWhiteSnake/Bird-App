-- Schema creation Scripts
CREATE TABLE users(
  id varchar(36) NOT NULL,
  email text NOT NULL,
  username text NOT NULL,
  phone_no text,
  password_hash text NOT NULL,
  profile_photo text,
  cash decimal(10,0) DEFAULT 0,
  follower_count int DEFAULT 0,
  confirmed tinyint(1) DEFAULT NULL,
  creation_date datetime DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_email (email(255)),
  UNIQUE KEY unique_username (username(255))
);
CREATE TABLE tweets(
    id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    root_tweet_id VARCHAR(36),
    image_link TEXT,
    video_link TEXT,
    article TEXT NOT NULL,
    restricted TINYINT(1),
    like_count INT DEFAULT 0,
    time DATETIME NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (root_tweet_id) REFERENCES tweets(id)
);
CREATE TABLE likes(
    id VARCHAR(36) NOT NULL,
    liker_id VARCHAR(36) NOT NULL,
    tweet_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (liker_id) REFERENCES users(id)
);

CREATE TRIGGER increase_likes_count_trigger
AFTER INSERT ON likes
FOR EACH ROW
UPDATE tweets
SET like_count = like_count + 1
WHERE id = NEW.tweet_id;

CREATE TRIGGER decrease_likes_count_trigger
AFTER DELETE ON likes
FOR EACH ROW
UPDATE tweets
SET like_count = like_count - 1
WHERE id = OLD.tweet_id;

CREATE TABLE links(
    id VARCHAR(36) NOT NULL,
    leader_id VARCHAR(36) NOT NULL,
    follower_id VARCHAR(36) NOT NULL,
    time DATETIME,
    PRIMARY KEY (id),
    FOREIGN KEY (leader_id) REFERENCES users(id),
    FOREIGN KEY (follower_id) REFERENCES users(id)
);

CREATE TRIGGER increase_follower_count_trigger
AFTER INSERT ON links
FOR EACH ROW
UPDATE users
SET follower_count = follower_count + 1
WHERE id = NEW.leader_id;

CREATE TRIGGER decrease_follower_count_trigger
AFTER DELETE ON links
FOR EACH ROW
UPDATE users
SET follower_count = follower_count - 1
WHERE id = OLD.leader_id;

CREATE TABLE settings(
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    theme VARCHAR(5) DEFAULT 'LIGHT',
    allow_notifications TINYINT(1) DEFAULT 1,
    PRIMARY KEY (id),
    FOREIGN KEY (USER_id) REFERENCES users(id)
);

CREATE TABLE notifications(
    id VARCHAR(36) NOT NULL,
    receipient_id VARCHAR(36) NOT NULL,
    tweet_id VARCHAR(36) NOT NULL,
    viewed TINYINT(1) DEFAULT 0,
    PRIMARY KEY(id),
    FOREIGN KEY (receipient_id) REFERENCES users(id)
);

ALTER TABLE users
ADD bio varchar(255) DEFAULT "";

ALTER TABLE users
Add following_count int DEFAULT 0;

ALTER TABLE users
ADD likes_count int DEFAULT 0;

ALTER TABLE users
ADD tweets_count int DEFAULT 0;

CREATE TRIGGER increase_following_count_trigger
AFTER INSERT ON links
FOR EACH ROW
UPDATE users
SET following_count = following_count + 1
WHERE id = NEW.follower_id;

CREATE TRIGGER decrease_following_count_trigger
AFTER DELETE ON links
FOR EACH ROW
UPDATE users
SET following_count = following_count - 1
WHERE id = OLD.follower_id;
/****/

CREATE TRIGGER increase_tweet_count_trigger
after insert on tweets
for each row
update users
set tweets_count = tweets_count + 1
where id = NEW.sender_id;

CREATE TRIGGER decrease_tweet_count_trigger
AFTER DELETE ON tweets
FOR EACH ROW
UPDATE users
SET tweets_count = tweets_count - 1
WHERE id = OLD.sender_id;

CREATE TRIGGER increase_tweeter_like_count_trigger
AFTER INSERT ON likes
FOR EACH ROW
UPDATE users
SET likes_count = likes_count + 1
WHERE id = NEW.liker_id;

CREATE TRIGGER decrease_tweeter_like_count_trigger
AFTER DELETE ON likes
FOR EACH ROW
UPDATE users
SET likes_count = likes_count - 1
WHERE id = OLD.liker_id;


-- Playground scripts
-- I used this to test my joins

-- Get the user row if the user already follows B
select l1.id from links JOIN users u1 on u1.username = 'dcwhitesnake'\
    Join users u2 on u2.id = u1.id \
    JOIN links l1 on l1.follower_id = '67f284e3-e548-48de-8a7b-e09948980291' AND l1.leader_id= u2.id;

SELECT u1.id FROM users u1 WHERE  u1.username = 'dcwhitesnake';

-- get list of followers
SELECT l1.follower_id, u1.username FROM links l1z
    JOIN users u1 ON u1.id = l1.follower_id AND l1.leader_id='67f284e3-e548-48de-8a7b-e09948980291';

SELECT follower_id, u1.username as follower_name, u2.username  as leader_name FROM links l1\
    JOIN users u1 ON u1.id = l1.follower_id AND l1.leader_id='67f284e3-e548-48de-8a7b-e09948980291'\
    JOIN users u2 ON u2.id = l1.leader_id;

-- get details of followers of user x given x's username
SELECT u1.username, u1.bio, u1.profile_photo FROM links l1\
    JOIN users u1 ON u1.id = l1.follower_id\
    JOIN users u2 on u2.id = l1.leader_id and u2.username='dcwhitesnake';

SELECT l1.follower_id, l1.leader_id FROM links \
    JOIN users u1 ON u1.username = "testfollower" \
    JOIN users u2 ON u2.id = 'f8fe14b7-5e1b-49df-9b1d-6777f8337c8d' \
    JOIN links l1 ON l1.follower_id = u1.id AND l1.leader_id = u2.id;