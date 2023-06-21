document.addEventListener("DOMContentLoaded", () => {
        path = window.location.pathname;
        if (path == "/profile") {
                const params = new URLSearchParams(window.location.search);
                const editProfileBtn = document.querySelector("#edit-profile-btn");
                const username = params.get("username");
                const tweetFeedDiv = document.querySelector("#tweet_feed");
                getBio(username);
                let pageNumber = 0;
                // fetches the first 10 tweets and displays to the user.
                getMyTweets(pageNumber, username);
                // every time the user scrolls, fetch the next 10 tweets
                tweetFeedDiv.addEventListener("scroll",
                        getMyTweets(++pageNumber, username));

                // setProfilePhoto();
                // getTweets();

                editProfileBtn.addEventListener("click", (e) => {
                        e.preventDefault();
                        window.location.href = editBioAddress;
                });
        }
        else {
                const backButton = document.querySelector("#back-to-profile-link");
                const username = localStorage.getItem("username");
                backButton.href += username;
                setAutnBio();
                const updateBioBtn =
                        document.querySelector("#update-bio-btn");
                const bioInput = document.querySelector("#bio");
                const profileImageInput =
                        document.querySelector("#profile-img-input");

                profileImageInput.addEventListener("change", displayProfilePicture)
                updateBioBtn.addEventListener("click", updateBio);
        }

});

/**
 * getBio - Returns the bio of the currently signed in user if any
 * and then displays it to the user
 */
function getBio(username) {
        let bioErrorMessage;
        const bioPTag = document.querySelector("#bio-p");
        const userNameTag = document.querySelector("#username-p");
        const followerCountTag = document.querySelector("#follower-count-a");
        const followingCountTag = document.querySelector("#following-count-a");
        const timeJoinedTag = document.querySelector("#time-joined-span");
        const profileImageTag = document.querySelector("#profile-img");
        fetch(bioRoute + `${username}`, {
                method: "GET"
        })
                .then((data) => {
                        if (data.ok) {
                                return data.json();
                        }
                        else {
                                throw new Error("Server-Error: Cannot connect to server");
                        }
                })
                .then((data) => {
                        if (data.status == 200) {

                                const jsonProfile = JSON.parse(data.message.Profile);
                                const userDetails = new User(jsonProfile);
                                bioPTag.textContent = userDetails.bio;
                                userNameTag.textContent = userDetails.username;
                                followerCountTag.textContent = userDetails.followerCount + " Followers";
                                followingCountTag.textContent = userDetails.followingCount + " Following";
                                timeJoinedTag.textContent = userDetails.getCreationDate();
                                if (userDetails.profilePhoto == "") {
                                        document.querySelector("#default-profile-icon")
                                                .style.display = "block";
                                        profileImageTag.style.display = "none";

                                }
                                else {
                                        document.querySelector("#default-profile-icon")
                                                .style.display = "none";
                                        profileImageTag.src = userDetails.profilePhoto;
                                }
                        }
                        else {
                                bioErrorMessage = data.message["Bio-Request-Error"];
                                bioPTag.textContent = "";
                                throw new Error(`Server-Error: ${bioErrorMessage}`);
                        }


                })
                .catch((exception) => {
                        console.log(exception);
                })
}

/**
 * setAutnBio - Sets the current bio values for the authenticated
 * in preparation for the patch request.
 */
function setAutnBio() {
        const username = localStorage.getItem("username");
        let bioErrorMessage;
        const bioPInput = document.querySelector("#bio");
        const userNameInput = document.querySelector("#username");
        const profileImageTag = document.querySelector("#profile-img");
        fetch(bioRoute + `${username}`, {
                method: "GET"
        })
                .then((data) => {
                        if (data.ok) {
                                return data.json();
                        }
                        else {
                                throw new Error("Server-Error: Cannot connect to server");
                        }
                })
                .then((data) => {
                        if (data.status == 200) {
                                const jsonProfile = JSON.parse(data.message.Profile);
                                const userDetails = new User(jsonProfile);
                                bioPInput.value = userDetails.bio;
                                userNameInput.value = userDetails.username;
                                if (userDetails.profilePhoto == null) {
                                        document.querySelector("#default-profile-icon")
                                                .style.display = "block";

                                }
                                else {
                                        document.querySelector("#default-profile-icon")
                                                .style.display = "none";
                                        profileImageTag.src = userDetails.profilePhoto;
                                }
                        }
                        else {
                                bioErrorMessage = data.message["Bio-Request-Error"];
                                throw new Error(`Server-Error: ${bioErrorMessage}`);
                        }

                })
                .catch((exception) => {
                        console.log(exception);
                })
}
/**updateBio - Changes the bio of the currently signed in user */
function updateBio(e) {
        const form = e.target.parentNode;
        const formData = new FormData(form);
        fetch(bioRoute, {
                method: "PATCH",
                headers: { "x-access-token": localStorage.getItem("jwt") },
                body: formData
        }).then((response) => {
                if (response.ok) {
                        return response.json();
                }
                else {
                        throw new Error("Cannot connect to server")
                }
        })
                .then((jsonData) => {
                        if (jsonData.status == 201) { }
                })
                .catch((err) => {
                        console.log(err)
                })

}
/**
 * setProfilePhoto - 
 */
function setProfilePhoto() {

}

/**
 * getTweets
 */
function setTweets() {

}


// Get the profile picture from the user's computer
// Display it
// Hide the default SVG
// Send it as a binary or blob to the server in the request
/**
 * display profile picture
 */
function displayProfilePicture(e) {
        const profileImageInput = e.target;
        if (profileImageInput.files[0]) {
                var img = document.querySelector("#profile-img");
                img.onload = () => {
                        URL.revokeObjectURL(img.src);
                }
                document.querySelector("#default-profile-icon").style.display = "none";
                img.src = URL.createObjectURL(profileImageInput.files[0]);
        }
}

/**
 * If there are no tweets, append the new tweet to the 
 * tweets div, else add tweets in a LIFO format manner 
 *@returns: nothing
 */
function addTweetToDOM(tweetBlock) {
        const tweetFeedDiv = document.querySelector("#tweet_feed");
        if (tweetFeedDiv.firstChild == null) {
                tweetFeedDiv.appendChild(tweetBlock);
        }
        else {
                tweetFeedDiv.insertBefore(tweetBlock, tweetFeedDiv.firstChild);
        }
}

/**
* Given tweet creation time in MYSQL datetime
* format, convert the string to simple adverbs relative
* to when the tweet is viewed by the follower ie.,
* "now", "1 week ago" etc.,
* 
*@returns {{String}} Adverb describing the time the tweet was 
*created relative to the current time
*/
function generateFriendlyTime(datetimeString) {

        const now = new Date();
        const datetime = new Date(datetimeString);
        const timeDiff = now - datetime;
        const oneMinute = 60 * 1000;
        const oneHour = 60 * oneMinute;
        const oneDay = 24 * oneHour;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;
        const oneYear = 365 * oneDay;

        if (timeDiff < oneMinute) {
                return 'now';
        } else if (timeDiff < oneHour) {
                const minutesAgo = Math.floor(timeDiff / oneMinute);
                return `${minutesAgo} minutes ago`;
        } else if (timeDiff < oneDay) {
                const hoursAgo = Math.floor(timeDiff / oneHour);
                return `${hoursAgo} hours ago`;
        } else if (timeDiff < oneWeek) {
                const daysAgo = Math.floor(timeDiff / oneDay);
                return `${daysAgo} days ago`;
        } else if (timeDiff < oneMonth) {
                const weeksAgo = Math.floor(timeDiff / oneWeek);
                return `${weeksAgo} weeks ago`;
        } else if (timeDiff < oneYear) {
                const monthsAgo = Math.floor(timeDiff / oneMonth);
                return `${monthsAgo} months ago`;
        } else if (timeDiff >= oneYear) {
                const yearsAgo = Math.floor(timeDiff / oneYear);
                return `${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago`;
        } else {
                // Fallback to the original datetime string if it doesn't fit into the interpretations
                return datetimeString;
        }
}

function getMyTweets(pageNumber, username) {
        fetch(myTweetsRoute + `?username=${username}&pageNumber=${pageNumber}`)
                .then((response) => {
                        if (response.ok) {
                                return response.json()
                        }
                        else {
                                throw new Error("Cannot connect to the server at this time");
                        }
                })
                .then((responseJson) => {
                        if (responseJson.status == 200) {
                                // var tweetObjects = JSON.parse(responseJson.message);
                                responseJson.message["tweets"].forEach((tweetObj) => {
                                        
                                        let tweetObject = JSON.parse(tweetObj);
                                        const newTweetBlock = document.createElement("div");
                                        const tweetTimeSpan = document.createElement("span");
                                        const tweetBody = document.createElement("p");
                                        const tweeterLink = document.createElement("a");

                                        newTweetBlock.style.backgroundColor = "#11ccff";
                                        newTweetBlock.style.border = "0.5px dotted black";

                                        tweetTimeSpan.textContent = generateFriendlyTime(tweetObject.t_time);
                                        tweetBody.textContent = tweetObject.tweet;
                                        tweeterLink.textContent = tweetObject.leader_username;
                                        tweeterLink.href = `${homeAddress}/index.html?username=${tweetObject.leader_username}`;

                                        newTweetBlock.appendChild(tweeterLink);
                                        newTweetBlock.appendChild(tweetTimeSpan);
                                        newTweetBlock.appendChild(tweetBody);
                                        addTweetToDOM(newTweetBlock);

                                });
                        }
                });
}