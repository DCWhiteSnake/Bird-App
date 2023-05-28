class User(object):
    # Describes  a details of this application
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
    #Create a user given details from db
    def create_user(details):
        return User(id = details["id"], username=details["username"], phone_no=details["phone_no"], email = details["email"],
                             password_hash = details["password_hash"], profile_photo=details["profile_photo"], cash=details["cash"],
                             follower_count=details["follower_count"], creation_date=details["creation_date"], confirmed=details["confirmed"])