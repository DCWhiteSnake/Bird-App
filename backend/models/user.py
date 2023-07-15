import json

class User(object):
    # Describes  a user_row of this application
    def __init__(self, id, email, username, phone_no, password_hash, creation_date,
                  follower_count, following_count, confirmed, profile_photo, cash, bio, tweets_count):
        self.id = id
        self.email = email
        self.username = username
        self.phone_no = phone_no
        self.password_hash = password_hash
        self.creation_date = creation_date
        self.follower_count = follower_count
        self.confirmed = confirmed
        self.profile_photo = profile_photo
        self.cash = cash
        self.bio = bio
        self.following_count = following_count
        self.tweets_count = tweets_count

    def __str__(self) -> str:
        user_dict = {"id" : self.id, "username":self.username, "phone_no":self.phone_no,
                    "email" : self.email,"password_hash" : self.password_hash,
                    "profile_photo":self.profile_photo, "cash":self.cash,
                    "follower_count":self.follower_count, "following_count": self.following_count, "creation_date":str(self.creation_date),
                    "confirmed":self.confirmed, "bio": self.bio, "tweets_count": self.tweets_count}
        return json.dumps(user_dict)
    
    def create_user(user_row):
        '''Create a user object given kvp(user_row) from db'''
        return User(id = user_row["id"], username=user_row["username"], phone_no=user_row["phone_no"], email = user_row["email"],
            password_hash = user_row["password_hash"], profile_photo=user_row["profile_photo"], cash=user_row["cash"],
            follower_count=user_row["follower_count"], following_count=user_row["following_count"],
            creation_date=user_row["creation_date"], confirmed=user_row["confirmed"], bio=user_row["bio"],
            tweets_count= user_row["tweets_count"])