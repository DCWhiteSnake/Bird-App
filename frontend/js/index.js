let db;
// Display previously stored tweets 👉 Get tweets from Server 👉 store in IndexDb 👉 display the new tweet/s
document.addEventListener("DOMContentLoaded", async () => {
    path = window.location.pathname;
    if (path == "/") {

        let jwt = localStorage.getItem("jwt");
        if (jwt == "null" || jwt == "") {
            setTimeout(() => {
                window.location.href = loginAddress;
            }, 3000);
        }
        else {
            const tokenIsValid = await CheckIfJWTIsValid(jwt);
            if (tokenIsValid) {
                populateNav();

                // Use IndexDb to Store previous tweets received before
                // Open our database; it is created if it doesn't already exist
                const openRequest = window.indexedDB.open("tweetsDb", 1);

                openRequest.addEventListener("error",
                    () =>
                        console.error("Database failed to open")
                );

                openRequest.addEventListener("success",
                    () => {
                        console.log("Database opened successfully");
                        db = openRequest.result;
                        displayTweetsStoredInDb();
                    });
                openRequest.addEventListener("upgradeneeded",
                    (e) => {
                        // Grab a reference to the opened database
                        let objectStore;
                        db = e.target.result;
                        let transaction = e.target.transaction;
                        if (e.newVersion > 1) {
                            // No-op pending database schema update
                            objectStore = transaction.objectStore("tweets");
                        }
                        else if (e.newVersion == 1) {

                            // Create an objectStore (table) in our database to store 
                            // the currently signed in user's tweets, this event
                            // is thrown if there are no objectStores in the database
                            // meaning that if this is the firs time this app is being
                            // used by an authenticated user, then create a db linked
                            // to this user's id ie., userUUID_TweetsDb
                            objectStore =
                                db.createObjectStore("tweets",
                                    {
                                        keyPath: "id"
                                    });
                            objectStore.createIndex("time",
                                "time", { unique: false });
                            objectStore.createIndex("leaderUsername",
                                "leaderUsername", { unique: false });
                            objectStore.createIndex("tweet",
                                "tweet", { unique: false });
                        }
                        // Well store the time, tweet and sender username in the db    
                        console.log("Database setup complete");
                    });
                // After we are sure that the login is succesful then start communication with the server
                // const socket = io("http://localhost:5000");
                const socket = io.connect('http://localhost:5000',
                    {
                        upgrade: false,
                        transports: ['websocket']
                    });

                socket.on('server-client', msg => {
                    console.log("Server: " + msg);
                    jwt = localStorage.getItem("jwt");
                    socket.emit("x-access-token", jwt);
                    console.log("Client: {token}");

                });
                socket.on('username', msg => {
                    console.log("Server: " + msg);
                    socket.emit('get_tweets', { "jwt": jwt });
                });

                // When a new tweet is created, emit message to get tweets, passing
                // passing the JWT as message.
                // the server emits a message in the format new_tweet_[username]

                // Following the get_tweets message the server returns
                // a message in the format new_tweet, username        
                socket.on("new_tweet", (data) => {
                    let username = document.querySelector('#username').textContent;
                    if (data == username) {
                        socket.emit('get_tweets', { "jwt": jwt });
                    }
                });

                socket.on("tweets", response_dict => {
                    r_id = response_dict["token"];
                    a_id = localStorage.getItem("id")
                    if (r_id == a_id) {
                        // log the raw data to the console
                        console.log(response_dict["tweets"]);
                        addTweetDataToDb(response_dict["tweets"]);
                    }
                });
                // every five seconds ask rabbit for tweet updates
                setInterval(checkForUpdates, 5000, socket)
            }
            else {
                localStorage.setItem("jwt", "");
                localStorage.setItem("username", "");
                localStorage.setItem("email", "");
                setTimeout(() => {
                    window.location.href = loginAddress;
                }, 3000);
            }
        }
    }
    else {
        const tokenIsValid = await CheckIfJWTIsValid(localStorage.getItem("jwt"));
        if (tokenIsValid) {
            populateNav();
        }
        else {
            localStorage.setItem("jwt", "");
            localStorage.setItem("username", "");
            localStorage.setItem("email", "");
            setTimeout(() => {
                window.location.href = loginAddress;
            }, 3000);
        }
    }

    document.querySelector("#search_username").addEventListener("input", createMiniProfileList);
    /**
     * Populates the nav-bar the user to the current username.
     *@returns: nothing
     */
    function populateNav() {
        let username = localStorage.getItem("username");
        let usernameP = document.querySelector('#username');
        let nameP = document.querySelector('#name')
        let profileLinkElement = document.querySelector("#profile-link");
        let profileImgElement = document.querySelector("#nav-profile-img");
        let profileImgContainer = document.querySelector("#profile-img-container");
        let defaultProfileImgContainer = document.querySelector("#default-img-container");
        fetch(profileImgRoute + username).
            then((response) => {
                if (response.ok) {
                    return response.json();
                }
            })
            .then((data) => {
                let profileImgSrc = data.message.profile_photo;
                profileImgElement.src = (profileImgSrc == null) ?
                    "/img/default_profile.png" : profileImgSrc + `?${new Date().getTime()}`;
                if (profileImgSrc == null) {
                    // Set the display of the profile div to non
                    profileImgContainer.style.display = "none";
                }
                else {
                    // Set the source of the profile-img element profileImageSrc
                    // Set the default profile icon to hidden
                    profileImgContainer.style.display = "block";
                    defaultProfileImgContainer.style.display = "none";
                    // profileImgElement.src = profileImageSrc;

                }
            })
            .catch((err) => {
                console.error(err);
            });

        usernameP.textContent = username;
        nameP.textContent = "@" + username;
        profileLinkElement.href = profileAddress + username;

    }
    /**
     * Check for tweets from people you currently follow 
     * 
     *@returns: nothing
     */
    function checkForUpdates(socket) {
        socket.emit("get_tweets", { "jwt": localStorage.getItem('jwt') })
    }
    /**
     * Get older tweets from the db and display to the user
     *@returns: nothing
     */
    function displayTweetsStoredInDb() {
        const objectStore =
            db.transaction("tweets").objectStore("tweets");
        /// My part
        let getAllTweetsRequest = objectStore.getAll();
        getAllTweetsRequest.addEventListener("success",
            (e) => {
                let dbTweets = e.target.result;
                // have to sort, no guarantee that
                // stored in indexDb is sorted.
                dbTweets.sort((a, b) => new Date(a.time) - new Date(b.time));
                dbTweets.forEach(dbTweet => {
                    let newTweetBlock = createTweetBlock(dbTweet);
                    addTweetToDOM(newTweetBlock);
                });
            });
    }

    /**
     * Store new tweets in IndexDb. then displays the tweet
     *@returns: nothing
     */
    function addTweetDataToDb(jsonData) {
        // create a new tweet block
        let data = JSON.parse(jsonData)
        // convert from object keys from python synax to js syntax
        data['time'] = data["t_time"];
        data["leaderUsername"] = data["leader_username"];
        let newTweetBlock = createTweetBlock(data);
        addTweetToDOM(newTweetBlock);
        // open a read/write db transaction
        const transaction = db.transaction(["tweets"], "readwrite");
        // call an object store that's already been added to the database
        const objectStore = transaction.objectStore("tweets")
        tweeterEntry = {
            id: data.id, tweet: data.tweet, time: data.time,
            leaderUsername: data.leaderUsername
        };
        const addRequest = objectStore.add(tweeterEntry);
        addRequest.addEventListener("success",
            () => {
                console.log("Success event thrown for add tweet to db")
            })

        transaction.addEventListener("complete",
            () => {
                console.log("Transaction completed: db modification \
                finished.");
                console.log(`tweet with id: ${data.id} stored successfully`);
                addTweetToDOM(newTweetBlock);
            })
    }
});

/**
 * If there are no tweets, append the new tweet to the 
 * tweets div, else add tweets in a LIFO format manner 
 *@returns: nothing
 */
function addTweetToDOM(tweetBlock) {
    let tweetFeedDiv = document.querySelector("#tweet_feed");
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
 * "now", "1 week " etc.
 * 
 *@returns {{String}} An adverb describing the time the tweet was 
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
        return `${minutesAgo} minutes`;
    } else if (timeDiff < oneDay) {
        const hoursAgo = Math.floor(timeDiff / oneHour);
        return `${hoursAgo} hours`;
    } else if (timeDiff < oneWeek) {
        const daysAgo = Math.floor(timeDiff / oneDay);
        return `${daysAgo} days`;
    } else if (timeDiff < oneMonth) {
        const weeksAgo = Math.floor(timeDiff / oneWeek);
        return `${weeksAgo} weeks`;
    } else if (timeDiff < oneYear) {
        const monthsAgo = Math.floor(timeDiff / oneMonth);
        return `${monthsAgo} months`;
    } else if (timeDiff >= oneYear) {
        const yearsAgo = Math.floor(timeDiff / oneYear);
        return `${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} `;
    } else {
        // Fallback to the original datetime string if it doesn't fit into the interpretations
        return datetimeString;
    }
}
function createTweetBlock(tweetDetailsObject) {

    const newTweetBlock = document.createElement("div");
    const tweetTimeSpan = document.createElement("span");
    const tweetBody = document.createElement("p");
    const tweeterLink = document.createElement("a");
    const tweeterImg = document.createElement("img");
    const tweeterImgContainer = document.createElement("div");
    const tweeterImgContainerGrid = document.createElement("div");
    const etcDetailsContainerGrid = document.createElement("div");
    const etcDetailsRow = document.createElement("div");

    newTweetBlock.classList.add("row");
    newTweetBlock.classList.add("tweet-block");
    tweeterImgContainerGrid.classList.add("col-1");
    tweeterImgContainerGrid.classList.add("small-2");
    tweeterImg.classList.add("tweeter-img");
    tweeterImgContainer.appendChild(tweeterImg);
    tweeterImgContainer.classList.add("tweeter-img-container");
    tweeterImgContainerGrid.appendChild(tweeterImgContainer);
    etcDetailsContainerGrid.classList.add("col-11");
    etcDetailsContainerGrid.classList.add("small-10");
    etcDetailsContainerGrid.appendChild(etcDetailsRow);
    etcDetailsRow.classList.add("row");
    etcDetailsRow.appendChild(tweeterLink);
    etcDetailsRow.appendChild(tweetTimeSpan);
    etcDetailsRow.appendChild(tweetBody);
    tweetBody.textContent = tweetDetailsObject.tweet;
    tweetBody.classList.add("col-12");
    tweetTimeSpan.classList.add("col-4");
    tweetTimeSpan.textContent = generateFriendlyTime(tweetDetailsObject.time);
    tweeterLink.classList.add("col-3");
    tweeterLink.textContent = tweetDetailsObject.leaderUsername;
    tweeterLink.href = `profile.html?username=${tweetDetailsObject.leaderUsername}`;

    //setProfile
    fetch(profileImgRoute + tweetDetailsObject.leaderUsername)
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.status = 200) {
                tweeterImg.src = (data.message.profile_photo == "") ? "img/default_profile.png" : data.message.profile_photo;
            }
        })

    newTweetBlock.appendChild(tweeterImgContainerGrid);
    newTweetBlock.appendChild(etcDetailsContainerGrid);
    newTweetBlock.setAttribute("data-tweet-id", tweetDetailsObject.id);
    return newTweetBlock;
}


/**
 * createMiniProfileList - Create a minimal divs containing profiles of users
 * whose usernames or display names are similar to the inputted one.
 * @returns nothing
 */
function createMiniProfileList(e) {
    try{
        let parentContainer = document.querySelector("#mini-profiles-container");
        parentContainer.classList.add("hidden");
        let miniProfiles = document.querySelectorAll(".mini-profile");
        miniProfiles.forEach((miniProfile) => {
            miniProfile.onclick = null;
            parentContainer.removeChild(miniProfile);
        });
    }
    catch{}
    getProfiles(e.target.value)
        .then((userObjects) => {
            let parentContainer = document.querySelector("#mini-profiles-container");
            if (userObjects.length == 0) {
                parentContainer.classList.add("hidden");
                let miniProfiles = document.querySelectorAll(".mini-profile");
                miniProfiles.forEach((miniProfile) => {
                    miniProfile.onclick = null;
                    parentContainer.removeChild(miniProfile);
                });
            }
            else {
                userObjects.forEach((userObject) => {
                    parentContainer.classList.remove("hidden");
                    parentContainer.classList.add("py-3");
                    const miniProfileImg = document.createElement("img");
                    miniProfileImg.classList.add("tweeter-img");

                    miniProfileImg.src = (userObject.profilePhoto == null) ? "img/default_profile.png" : userObject.profilePhoto; 
                    const miniProfileImgCircularContainer = document.createElement("div");
                    miniProfileImgCircularContainer.classList.add("tweeter-img-container", "mx-auto");
                    miniProfileImgCircularContainer.appendChild(miniProfileImg);
                    const miniProfileImgContainer = document.createElement("div");
                    miniProfileImgContainer.classList.add("col-3");
                    miniProfileImgContainer.appendChild(miniProfileImgCircularContainer)
  
                    const miniProfileBlackName = document.createElement("p");
                    miniProfileBlackName.textContent = "@" + userObject.username;
                    const miniProfileNamesContainer = document.createElement("div");
                    miniProfileNamesContainer.classList.add("col-9");
                    miniProfileNamesContainer.appendChild(miniProfileBlackName);
                   
                    const miniProfileContainer = document.createElement("div");
                    miniProfileContainer.classList.add("mini-profile", "col-12", "py-2");
                    miniProfileContainer.addEventListener('click', (e) => {
                        window.location.href = profileAddress + userObject.username;
                    })
                    miniProfileContainer.classList.add("row");
                    miniProfileContainer.appendChild(miniProfileImgContainer);
                    miniProfileContainer.appendChild(miniProfileNamesContainer);
                    parentContainer.appendChild(miniProfileContainer);
                });
            }
        });

}
/**
 * getProfiles - user the fetch api to get user details and then convert to a list of user objects.
 * @returns {{Promise<array>}} a Promise that resolves to an array of users.
 */
function getProfiles(query) {
    if (query == "") {
        return Promise.resolve([])
    }
    let profileList = [];
    let defaultPageSize = 3;
    return fetch(searchProfilesRoute + `?query=${query}&pageSize=${defaultPageSize}`)
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((responseJson) => {
            if (responseJson.status == 200) {
                let rawProfileList = responseJson.message.profiles;
                rawProfileList.forEach((rProfile) => {
                    profileList.push(new User(rProfile));
                });
                return profileList;
            }
            else {
                return [];
            }

        })
        .catch((error) => {
            console.error(error);
        })
        .finally(() => {

        })
}
/**
 * Follow - Give a valid user id, sends a post request to follow the user
 * @param {{String}} id A valid user id
 * @returns {{Promise<Array>}} A promise that resolves to true if the follow event is successful and false otherwise.
 */
function follow(id) {
    let jwt = localStorage.getItem("jwt");
    if (jwt != null) {
            return fetch(followUserRoute + `?id=${id}`, {
                    method: 'POST', headers: { 'x-access-token': jwt },
            })
                    .then((response) => {
                            if (response.ok) {
                                    let responseJson = response.json();
                                    return responseJson;
                            }
                    })
                    .then((responseJson) => {
                            let f_status;
                            if (responseJson.status == 201) {
                                    f_status = true;
                            }
                            else if (responseJson.status == 500) {
                                    f_status = false;
                            }
                            return f_status;
                    })
                    .catch((error) => {
                            console.log(error.message);
                            f_status = false;
                            return f_status;
                    });

    }
    else {
            return Promise.resolve(false);
    }
}

/**
* Follow - Give a valid user id, sends a post request to unfollow the user
* @param {{String}} id A valid user id
* @returns {{Promise<Array>}} A promise that resolves to true if the unfollow event is successful and false otherwise.
*/
function unfollow(id) {
    let jwt = localStorage.getItem("jwt");
    if (jwt != null) {
            return fetch(followUserRoute + `?id=${id}`, {
                    method: 'DELETE', headers: { 'x-access-token': jwt },
            })
                    .then((response) => {
                            if (response.ok) {
                                    let responseJson = response.json();
                                    return responseJson;
                            }
                    })
                    .then((responseJson) => {
                            let f_status;
                            if (responseJson.status == 200) {
                                    f_status = true;
                            }
                            else if (responseJson.status == 500) {
                                    f_status = false;
                            }
                            return f_status
                    })
                    .catch((error) => {
                            console.log(error.message);
                            f_status = false;
                    });

    }
    else {
            return Promise.resolve(false);
    }
}

/**
* createunfollowBtn - Create a styled html button element for unfollowing
* a user.
* @param {*} user the user to unfollow.
* @returns {{HTMLButtonElement}} A styled html button element
*/
function createunfollowBtn(user) {
    const unfollowBtn = document.createElement("button");
    unfollowBtn.type = "button";
    unfollowBtn.setAttribute("data-id", user.id);
    unfollowBtn.textContent = "Following";
    unfollowBtn.classList.add("following-btn");
    unfollowBtn.addEventListener("mouseover", () => {
            unfollowBtn.textContent = "Unfollow";
            unfollowBtn.classList.remove("following-btn");
            unfollowBtn.classList.add("unfollow-btn");
    });
    unfollowBtn.addEventListener("mouseout", () => {
            unfollowBtn.textContent = "Following";
            unfollowBtn.classList.remove("unfollow-btn");
            unfollowBtn.classList.add("following-btn");
    });
    return unfollowBtn;
}

/**
* createFollowBtn - Create a styled html button element for following
* a user
* @param {*} user the user to follow
* @returns A styled html button element
*/
function createFollowBtn(user) {
    const followBtn = document.createElement("button");
    followBtn.type = "button";
    followBtn.setAttribute("user-id", user.id);
    followBtn.classList.add("follow-btn");
    followBtn.textContent = "Follow";
    return followBtn;
}
/**
 * createOptBtn - Create a html button element whose function is to show options on accounts
 * @returns A styled html button element
 */
function createOptBtn() {
    const optSpan = document.createElement("span");
    optSpan.classList.add("opt-span");
    optSpan.textContent = "...";
    const optBtn = document.createElement("button");
    optBtn.classList.add("opt-btn", "mx-1");
    optBtn.type = "button";
    optBtn.appendChild(optSpan);
    return optBtn;
}