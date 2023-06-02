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


-- Get the user row if the user already follows B
select l1.id from links JOIN users u1 on u1.username = 'dcwhitesnake' Join users u2 on u2.id = u1.id JOIN links l1 on l1.follower_id = '67f284e3-e548-48de-8a7b-e09948980291' AND l1.leader_id= u2.id;

SELECT u1.id FROM users u1 WHERE  u1.username = 'dcwhitesnake';


