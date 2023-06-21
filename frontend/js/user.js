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
        
        }

        getCreationDate(){
             return this.beautifyCreationDate();   
        }
        beautifyCreationDate() {
                return this.creationDate;
        }

}