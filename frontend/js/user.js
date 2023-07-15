class User{
        constructor(userObject){
                this.id = userObject.id;
                this.email = userObject.email;
                this.username = userObject.username;
                this.phoneNo = userObject.phone_no;
                this.creationDate = userObject.creation_date;
                this.followerCount = userObject.follower_count;
                this.followingCount = userObject.following_count;
                this.confirmed = userObject.confirmed;
                this.profilePhoto = userObject.profile_photo;
                this.cash = userObject.cash;
                this.bio = userObject.bio;
                this.tweetCount = userObject.tweets_count;
        }

        getCreationDate(){
             return this.beautifyCreationDate();   
        }

        beautifyCreationDate() {
                let jsTimeRep = new Date(this.creationDate);
                let months = {1:"January", 2:"Febuary", 3:"March", 4:"April", 5:"May", 6:"June",
                                7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"};
                return `Joined ${months[jsTimeRep.getMonth()]} ${jsTimeRep.getFullYear()}`;
        }

}