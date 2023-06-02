import json

class tweet:
    def __init__(self, sender_id, tweet, receiver_id):
        self.sender_id = sender_id
        self.tweet = tweet
        self.receiver_id = receiver_id

    @classmethod
    def create_from_json(cls, tweet_json):
        """ Create a tweet from json data """
        tweet_dict = json.load(tweet_json)
        return cls(tweet_dict["sender_id"], tweet_dict["tweet"], tweet_dict["receiver_id"])
    
    def __str__(self) -> str:
        
        tweet_dict = {"sender_id": self.sender_id, "tweet": self.tweet, "receiver_id": self.receiver_id}
        tweet_json = json.dumps(tweet_dict)
        return (str(tweet_json))