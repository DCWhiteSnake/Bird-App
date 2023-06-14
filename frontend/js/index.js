
// Display previously stored tweets 👉 Get tweets from Server 👉 store in IndexDb 👉 display the new tweet/s

document.addEventListener("DOMContentLoaded", async() => {
    let tweetFeedDiv = document.querySelector("#tweet_feed");
    let db;
    let jwt = localStorage.getItem("jwt");
    if (jwt == "null" || jwt == "") {
        setTimeout(() => {
            window.location.href = loginAddress;
        }, 3000);
    }
    else {
        const tokenIsValid = await CheckIfJWTIsValid(jwt);
        if (tokenIsValid) {
            setUsernameSpan();

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
                if (e.newVersion > 1){
                    // No-op pending database schema update
                    objectStore = transaction.objectStore("tweets");
                }
                else if (e.newVersion == 1){
                
                    // Create an objectStore (table) in our database to store 
                    // the currently signed in user's tweets, this event
                    // is thrown if there are no objectStores in the database
                    // meaning that if this is the firs time this app is being
                    // used by an authenticated user, then create a db linked
                    // to this user's id ie., userUUID_TweetsDb
                    objectStore  = 
                    db.createObjectStore("tweets",
                    {
                        keyPath: "id"
                    });
                    objectStore.createIndex("time",
                    "time", {unique: false});
                    objectStore.createIndex("leaderUsername",
                    "leaderUsername", {unique: false});
                    objectStore.createIndex("tweet",
                    "tweet", {unique: false});
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
            localStorage.setItem("Email", "");
            setTimeout(() => {
                window.location.href = loginAddress;
            }, 3000);
        }
    }
    
    /**
     * Sets the span located within the div that greets
     * the user to the current username. This username is gotten
     * from local storage
     *@returns: nothing
     */
    function setUsernameSpan() {
        let username = localStorage.getItem("username");
        let username_span = document.querySelector('#username');
        username_span.textContent = username;
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
     * Giving tweet creation time in MYSQL datetime
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
    
    /**
     * Get older tweets from the db and display to the user
     *@returns: nothing
     */
    function displayTweetsStoredInDb()
    {
        const objectStore = 
            db.transaction("tweets").objectStore("tweets");
        /// My part
        let getAllTweetsRequest = objectStore.getAll();
        getAllTweetsRequest.addEventListener("success",
        (e) => {
            let dbTweets = e.target.result;
            // have to sort, no guarantee that data is sorted.
            dbTweets.sort((a,b) => new Date(a.time) - new Date(b.time));
            dbTweets.forEach(dbTweet => 
            {
                const newTweetBlock = document.createElement("div");
                const tweetTimeSpan = document.createElement("span");
                const tweetBody = document.createElement("p");
                const tweeterLink = document.createElement("a");

                newTweetBlock.appendChild(tweeterLink);
                newTweetBlock.appendChild(tweetTimeSpan);
                newTweetBlock.appendChild(tweetBody);

                tweetBody.textContent = dbTweet.tweet;
                tweetTimeSpan.textContent = generateFriendlyTime(dbTweet.time);
                tweeterLink.textContent = dbTweet.leaderUsername;
                tweeterLink.href = `profile?username=${dbTweet.leaderUsername}`;
                // Add some amazing styles
                newTweetBlock.style.backgroundColor = "#11ccff";
                newTweetBlock.style.border = "0.5px dotted black";

                // Store this for delete whenever the tweet auther decides to delete
                newTweetBlock.setAttribute("data-tweet-id", dbTweet.id);
                addTweetToDOM(newTweetBlock);
            });
        });
    }

    /**
     * If there are no tweets, append the new tweet to the 
     * tweets div, else add tweets in a LIFO format manner 
     *@returns: nothing
     */
    function addTweetToDOM(tweetBlock) {

        if (tweetFeedDiv.firstChild == null) {
            tweetFeedDiv.appendChild(tweetBlock);
        }
        else {
            tweetFeedDiv.insertBefore(tweetBlock, tweetFeedDiv.firstChild);
        }
    }
    /**
     * Store new tweets in IndexDb. then displays the tweet
     *@returns: nothing
     */
    function addTweetDataToDb(jsonData) {
                            // create a new tweet block
        let tweetEntry;
        const newTweetBlock = document.createElement("div");
        const data = JSON.parse(jsonData);
        const tweetTimeSpan = document.createElement("span");
        const tweetBody = document.createElement("p");
        const tweeterLink = document.createElement("a");

        newTweetBlock.style.backgroundColor = "#11ccff";
        newTweetBlock.style.border = "0.5px dotted black";
       
        tweetTimeSpan.textContent = generateFriendlyTime(data.t_time);
        tweetBody.textContent = data.tweet;
        tweeterLink.textContent = data.leader_username;
        tweeterLink.href = `${homeAddress}/index.html?username=${data.leader_username}`;
        
        newTweetBlock.appendChild(tweeterLink);
        newTweetBlock.appendChild(tweetTimeSpan);
        newTweetBlock.appendChild(tweetBody);

        // open a read/write db transaction
        const transaction = db.transaction(["tweets"], "readwrite");

        // call an object store that's already been added to the database
        const objectStore = transaction.objectStore("tweets")

        tweeterEntry = {id: data.id, tweet: data.tweet, time: data.t_time,
            leaderUsername: data.leader_username};
    
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
