CREATE TABLE users(
    id VARCHAR(36) NOT NULL,
    email TEXT NOT NULL, 
    username TEXT NOT NULL,
    phone_no TEXT,
    password_hash TEXT NOT NULL,
    profile_photo TEXT,
    cash DECIMAL DEFAULT 0,
    follower_count INT DEFAULT 0,
    confirmed TINYINT(1),
    creation_date DATETIME
    PRIMARY KEY  (id)
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
