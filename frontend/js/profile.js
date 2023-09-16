let killGettingTweets = false;
document.addEventListener("DOMContentLoaded", () => {
        path = window.location.pathname;
        if (path == "/profile.html") {
                const params = new URLSearchParams(window.location.search);

                const username = params.get("username");
                // const tweetFeedDiv = document.querySelector("#tweet_feed");
                let editProfileContainer = document.querySelector("#edit-profile-container");
                editProfileContainer.classList.add("hidden");
                const tweetFeedDiv = document.querySelector(".man");

                let pageNumber = 0;

                // fetches the first 10 tweets and displays to the user.
                getMyTweets(pageNumber, username);

                let maxScroll = 200;
                // every time the user scrolls, fetch the next 10 tweets
                tweetFeedDiv.addEventListener("scroll", () => {
                        let currentScrollValue = tweetFeedDiv.scrollTop;
                        if (!killGettingTweets && (currentScrollValue > maxScroll)) {
                                getMyTweets(++pageNumber, username);
                        }
                        maxScroll = (tweetFeedDiv.scrollTop > maxScroll)?
                       (tweetFeedDiv.scrollTop + 200) : maxScroll;
                })

                getBio(username)
                        .then((user) => {
                                document.querySelectorAll(".follow-link")
                                        .forEach((link) => {
                                                link.addEventListener('click', () => {
                                                        window.location.href = `follow.html?username=${username}&opt=${link.getAttribute('data-option')}`
                                                })
                                        });

                                openProfileLink();
                                let target_list = [];
                                const optContainer = document.querySelector("#opt-container");
                                const optBtn = createOptBtn();
                                optBtn.classList.add("opt-content", "opt-content-left");
                                if (user.username != localStorage.getItem("username")) {
                                        checkIfFollowing(username)
                                                .then((u_follow) => {
                                                        const unfollowBtn = createunfollowBtn(user, target_list);
                                                        unfollowBtn.classList.add("opt-content", "opt-content-left");
                                                        unfollowBtn.addEventListener("click", (e) => {
                                                                target_list.push("uf-btn");
                                                                unfollow(e.target.getAttribute("data-id"))
                                                                        .then((status) => {
                                                                                if (status) {
                                                                                        optContainer.removeChild(unfollowBtn);
                                                                                        optContainer.prepend(followBtn);
                                                                                }
                                                                        });
                                                        });
                                                        const followBtn = createFollowBtn(user);
                                                        followBtn.classList.add("opt-content", "opt-content-left");
                                                        followBtn.addEventListener("click", (e) => {
                                                                target_list.push("f-btn");
                                                                follow(e.target.getAttribute("user-id"))
                                                                        .then((success) => {
                                                                                if (success) {
                                                                                        optContainer.removeChild(followBtn);
                                                                                        optContainer.prepend(unfollowBtn)
                                                                                }
                                                                        });
                                                        });
                                                        if (u_follow) {
                                                                optContainer.appendChild(optBtn);
                                                                optContainer.prepend(unfollowBtn);

                                                        }
                                                        else {
                                                                optContainer.appendChild(optBtn);
                                                                optContainer.prepend(followBtn);

                                                        }
                                                }).
                                                catch((e) => {
                                                        console.error(e);
                                                });


                                }
                                else {

                                        optContainer.appendChild(createEditProfileBtn());
                                        optContainer.appendChild(optBtn);
                                }
                        })
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
                                        if ((responseJson.message["tweets"]).length == 0) {
                                                killGettingTweets = true;
                                        }
                                        // var tweetObjects = JSON.parse(responseJson.message);
                                        responseJson.message["tweets"].forEach((tweetObj) => {
                                                let tweetObject = JSON.parse(tweetObj);
                                                tweetObject['time'] = tweetObject["t_time"];
                                                tweetObject["leaderUsername"] = tweetObject["leader_username"];
                                                const newTweetBlock = createTweetBlock(tweetObject);
                                                appendTweetToDOM(newTweetBlock);
                                        });
                                }
                        });
        }
});
/**
 * appendTweetToDOM - Postpends tweet items to the tweet block
 * @param {tweetBlock} - The div containing the tweet html elements 
 */
function appendTweetToDOM(tweetBlock) {
        let tweetFeedDiv = document.querySelector("#tweet_feed");
        tweetFeedDiv.appendChild(tweetBlock);
}
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
        const profileImageTagLg = document.querySelector("#profile-img-lg");
        const defaultProfileImageContainer = document.querySelector("#default-img-container");
        // const defaultProfileIcon = document.querySelector("#default-profile-icon");
        const bannerName = document.querySelector("#banner-name");
        const bannerTweetCount = document.querySelector("#banner-tweet-count");
        return fetch(bioRoute + `${username}`, {
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
                                bannerName.textContent = userDetails.username;
                                bannerTweetCount.textContent = userDetails.tweetCount + " tweets";
                                followerCountTag.prepend(userDetails.followerCount);

                                followingCountTag.prepend(userDetails.followingCount);
                                timeJoinedTag.textContent = userDetails.getCreationDate();
                                profileImageTagLg.src = (userDetails.profilePhoto == null) ?
                                        "/img/default_profile.png" : userDetails.profilePhoto + `?${new Date().getTime()}`;
                                // defaultProfileIcon.style.display = defaultProfileImageContainer.style.display = (userDetails.profilePhoto) ? "none" : "block";
                                return userDetails;
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
        const bioPInput = document.querySelector("#edit-bio");
        const userNameInput = document.querySelector("#edit-username");
        const editProfileImgTag = document.querySelector("#edit-profile-img");
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
                                editProfileImgTag.src = (userDetails.profilePhoto == null) ?
                                        "/img/default_profile.png" : userDetails.profilePhoto + `?${new Date().getTime()}`;
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
function updateBio() {
        const form = document.querySelector("#update-form");
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
                        if (jsonData.status == 201) {
                                const usernameInput = document.querySelector("input[name*='username']");
                                localStorage.setItem("username", usernameInput.value);
                                let username = usernameInput.value;
                                window.location.href = `/profile.html?username=${username}`;
                        }
                        else {
                                if (jsonData.message['WWW-Authenticate']) {
                                        localStorage.setItem("jwt", "");
                                        // window.location.href = ("login.html");
                                }
                                else if (jsonData.message['Image-Error']) {
                                        console.log(`Image Error: ${jsonData.message['Image-Error']}`);

                                }
                        }
                })
                .catch((err) => {
                        console.log(err)
                })

}
// Get the profile picture from the user's computer
// Display it
// Hide the default SVG
// Send it as a binary or blob to the server in the request
/**
 * displayUploadedImage - Displays the selected image during an update profile flow.
 * @e: The change event fired by the file input element
 */
function displayUploadedImge(e) {
        const profileImageInput = e.target;
        if (profileImageInput.files[0]) {
                var editImg = document.querySelector("#edit-profile-img");
                editImg.onload = () => {
                        URL.revokeObjectURL(editImg.src + `?${new Date().getTime()}`);
                }
                try {
                        document.querySelector("#default-profile-icon").style.display = "none";
                }
                catch {
                        console.log("tbd");
                }
                editImg.src = URL.createObjectURL(profileImageInput.files[0]);
        }
}

function openProfileLink() {
        document.querySelector("#main-profile-link").addEventListener('click', (e) => {
                e.preventDefault();
                window.open(e.target.href, "_blank").focus();
        })
}

function checkIfFollowing(username) {
        return fetch(checkFollowingRoute + `?username=${username}`,
                { headers: { "x-access-token": localStorage.getItem("jwt") } })
                .then((response) => {
                        if (response.ok) {
                                return response.json();
                        }
                })
                .then((responseJson) => {
                        if (responseJson.status == 200) {
                                return responseJson.message.u_follow
                        }
                }).catch((e) => {
                        return Promise.resolve(true);
                });
}

/**
 * createEditProfileBtn - Creates the edit button.
 * @returns {{HtmlButtonElement}}
 */
function createEditProfileBtn() {
        const editProfileContainer = document.querySelector("#edit-profile-container");
        const editProfileBtn = document.createElement("button");
        editProfileBtn.textContent = "Edit profile";
        editProfileBtn.id = "edit-profile-btn";
        editProfileBtn.classList.add("opt-content","opt-content-left");
        editProfileBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (!e.target.classList.contains("hidden-edit-btn")) {
                        // let mc = document.querySelector(".content-1");
                        let html = document.querySelector("body");
                        html.classList.add("disabled");

                        let mainContent = document.querySelector("#content-1");
                        mainContent.classList.add("disabled");

                        let sideMenu = document.querySelector("#sidebar_menu");
                        sideMenu.classList.add("disabled");
                        editProfileContainer.classList.remove("hidden");
                        const cancelButton = document.querySelector("#cancel-edit-btn");
                        cancelButton.addEventListener('click', () => {
                                editProfileContainer.classList.add("hidden");

                                html.classList.remove("disabled");
                                mainContent.classList.remove("disabled");
                                sideMenu.classList.remove("disabled");
                        })
                        const username = localStorage.getItem("username");
                        setAutnBio();
                        const updateBioBtn =
                                document.querySelector("#update-bio-btn");
                        const bioInput = document.querySelector("#bio");
                        const profileImageInput =
                                document.querySelector("#profile-img-input");

                        profileImageInput.addEventListener("change", displayUploadedImge)
                        updateBioBtn.addEventListener("click", updateBio);
                }
        });
        return editProfileBtn;
}