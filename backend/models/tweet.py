import json

class tweet:
    def __init__(self, tweet, receiver_id, leader_username, t_time, id):
        self.tweet = tweet
        self.receiver_id = receiver_id
        self.leader_username = leader_username
        self.t_time = t_time
        self.id = id

    @classmethod
    def create_from_json(cls, tweet_json):

        """ Create a tweet object from json data """
        tweet_dict = json.loads(tweet_json)
        return cls(tweet_dict["tweet"][0], tweet_dict["receiver_id"], tweet_dict["leader_username"], tweet_dict["tweet"][1], tweet_dict["tweet"][2])
    
    def __str__(self) -> str:
        
        tweet_dict = {"tweet": self.tweet, "receiver_id": self.receiver_id, "leader_username": self.leader_username,
                      "t_time" : self.t_time, "id": self.id}
        tweet_json = json.dumps(tweet_dict)
        return (str(tweet_json))