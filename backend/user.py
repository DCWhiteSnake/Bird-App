class User(object):
    # Describes  a user_row of this application
    def __init__(self, id, email, username, phone_no, password_hash, creation_date, follower_count, confirmed, profile_photo, cash):
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

    def __str__(self) -> str:
        return f"User(id={self.id})"
    
    def create_user(user_row):
        '''Create a user object given kvp(user_row) from db'''
        return User(id = user_row["id"], username=user_row["username"], phone_no=user_row["phone_no"], email = user_row["email"],
                             password_hash = user_row["password_hash"], profile_photo=user_row["profile_photo"], cash=user_row["cash"],
                             follower_count=user_row["follower_count"], creation_date=user_row["creation_date"], confirmed=user_row["confirmed"])