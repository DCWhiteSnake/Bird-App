document.addEventListener("DOMContentLoaded", () => {
        const followersContainer = document.querySelector("#followers-container");
        const followingContainer = document.querySelector("#following-container");
        const followersLinkContainer = document.querySelector("#followers-link-container");
        const followingLinkContainer = document.querySelector("#following-link-container");
        const blueThingy = document.createElement("div");
        let fetchAgain = true;
        let followersPageNum = -1, followingPageNum = -1;
        const params = new URLSearchParams(window.location.search);
        let option = params.get("opt");
        let paramsUsername = params.get("username");
        const profileLink = document.querySelector("#profile-link");
        profileLink.href = window.location.search;
        /**
        * getOptionList - Displays the list of users depending on
        * the option
        * @param {} option:  one of followers | following
        */
        const getOptionList = (option) => {
                increaseOptionCount(option);
                let pageNumber = (option == "followers") ? followersPageNum : followingPageNum;
                fetch(baseRoute + "user/" + option + "?username=" + paramsUsername
                        + `&pageNumber=${pageNumber}`)
                        .then((response) => {
                                if (response.ok) {
                                        return response.json();
                                }
                                else {
                                        throw new Error("Can't contact the server");
                                }
                        })
                        .then((responseJson) => {
                                if (responseJson.status = 200) {
                                        usersList = responseJson.message[option];
                                        if (usersList.length > 0) {
                                                fetchAgain = true
                                                usersList.forEach((userRow) => {
                                                        const user = JSON.parse(userRow);
                                                        // lvOneRow
                                                        const lvOneRow = document.createElement("div");
                                                        
                                                        const fCol1 = document.createElement("div");
                                                        const profileContainer = document.createElement("div");
                                                        const profileImgContainer = document.createElement("div");
                                                        const profileImg = document.createElement("img");
                                                        profileImg.src = (user.profile_photo == null) ?
                                                                "/img/default_profile.png" : user.profile_photo + `?${new Date().getTime()}`;
                                                        profileImg.alt = "Profile Image";
                                                        profileImg.classList.add("profile-img-sm");
                                                        lvOneRow.classList.add("row");
                                                        lvOneRow.appendChild(fCol1);
                                                        
                                                        fCol1.classList.add("col-2");-
                                                        fCol1.appendChild(profileImgContainer);
                                                        profileImgContainer.classList.add("profile-img-container-sm")
                                                        profileImgContainer.appendChild(profileImg);
                                                        const fCol2 = document.createElement("div");
                                                        const optRow = document.createElement("div");
                                                        const pending = document.createElement("div");
                                                        fCol2.classList.add("col-10");
                                                        lvOneRow.appendChild(fCol2);
                                                        pending.classList.add("row")
                                                        
                                                        fCol2.appendChild(pending);
                                                        const namesContainer = document.createElement("div");
                                                        namesContainer.classList.add("col-8");
                                                        const blackName = document.createElement("p");
                                                        const greyName = document.createElement("p");
                                                        namesContainer.appendChild(blackName);
                                                        namesContainer.appendChild(greyName);
                                                        blackName.classList.add("name", "username-black");
                                                        greyName.classList.add("name", "username-grey");
                                                        blackName.textContent = user.username;
                                                        greyName.textContent = "@" + user.username;
                                                        const funcBtnsContainer = document.createElement("div")
                                                        funcBtnsContainer.classList.add("col-4");
                                                        const followBtn = document.createElement("button");
                                                        const optBtn = document.createElement("button");
                                                        
                                                        const localStorageUsername = localStorage.getItem("username");
                                                        let paramsUsername = params.get("username");
                                                        if (localStorageUsername == paramsUsername){
                                                                funcBtnsContainer.appendChild(followBtn);
                                                        }
                                                        
                                                        funcBtnsContainer.appendChild(optBtn);
                                                        followBtn.classList.add("follow-btn");
                                                        followBtn.textContent = "Follow";
                                                        optBtn.classList.add("opt-btn");
                                                        const optSpan = document.createElement("span")
                                                        optSpan.classList.add("opt-span")
                                                        optSpan.textContent = "...";
                                                        optBtn.appendChild(optSpan);
                                                        pending.appendChild(namesContainer);
                                                        pending.appendChild(funcBtnsContainer);
                                                        
                                                        const bioRow = document.createElement("div");
                                                        bioRow.classList.add("col-12");
                                                        pending.appendChild(bioRow);
                                                        const bioPara = document.createElement("p");
                                                        bioPara.textContent = user.bio;
                                                        bioRow.appendChild(bioPara);
                                                        


                                                        profileContainer.classList.add("container", "profile-node");
                                                        profileContainer.setAttribute("data-username", user.username);
                                                        profileContainer.appendChild(lvOneRow);
                                                        switch (option) {
                                                                case "following":
                                                                        followingContainer.appendChild(profileContainer);
                                                                        break;
                                                                case "followers":
                                                                default:
                                                                        followersContainer.appendChild(profileContainer);
                                                                        break;
                                                        }

                                                        profileContainer.addEventListener("click", () =>{
                                                        
                                                                window.location.href = profileAddress + user.username;
                                                        })

                                                });
                                        }
                                        else {
                                                fetchAgain = false;
                                        }
                                }

                        })
                        .catch((error) => {
                                console.error(error);
                        })

        }
        
        blueThingy.classList.add("blue-rect");
        blueThingy.id = "blue-thingy";
        switchToOption(option);
        document.querySelectorAll(".option-btn").forEach((btn) => {
                btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        switchToOption(btn.getAttribute("data-option"));
                });
        });

        // //This block makes requests via getOptionList assume getOptionList is without bugs.
        // The function of this block is to add object to a scrollable container/s depending on
        // increasing scrolls. It gives a repeated output
        document.querySelectorAll(".link-container").forEach((container) => {

                container.addEventListener('scroll', (e) => {
                        if (isScrollEnd(e))
                                addSubsequentOptions(getOptionList, 100, option);
                });
        });
        document.querySelectorAll(".profile-block").forEach((block) => {
                block.addEventListener("click", (e) => {
                        e.preventDefault();
                        window.location.href = "profile?username=" + e.target.getAttribute("data-username");
                });
        })
        /**
         * switchToOption - Display the div containing the selected option
         * option: one of following | followers
         */
        async function switchToOption(option) {
                switch (option) {
                        case "following":

                                followingContainer.style.display = "block";

                                followersContainer.style.display = "none";
                                blueThingy.classList.add("blue-rect");
                                try {
                                        followersLinkContainer.removeChild(document.querySelector("#blue-thingy"));
                                }
                                catch { }
                                followingLinkContainer.appendChild(blueThingy);
                                getOptionList(option);
                                break;
                        case "followers":
                        default:

                                followersContainer.style.display = "block";

                                followingContainer.style.display = "none";
                                blueThingy.classList.add("blue-rect");
                                try {
                                        followingLinkContainer.removeChild(document.querySelector("#blue-thingy"));
                                }
                                catch { }
                                followersLinkContainer.appendChild(blueThingy);
                                getOptionList(option);
                                break;

                }
        }


        // Function to check if the user has reached the end of the scrollable area
        function isScrollEnd(e) {
                var element = e.target;
                var scrollTop = element.scrollTop;
                var scrollHeight = element.scrollHeight;
                var clientHeight = element.clientHeight;
                var bool = (Math.abs(scrollHeight - scrollTop - clientHeight) < 1) && fetchAgain == true;
                // Check if the user has scrolled to the bottom of the scrollable area
                if (bool) {
                        console.log("true");
                }
                return bool;
        }
        function increaseOptionCount(option) {
                switch (option) {
                        case "following":
                                followingPageNum++;
                                break;
                        case "followers":
                        default:
                                followersPageNum++;
                                break;
                }
        }
        const addSubsequentOptions = (callback, delay, option) => {
                let timeoutHandler = null;
                if (timeoutHandler) {
                        clearTimeout(timeoutHandler);
                }
                timeoutHandler = setTimeout(() => {
                        callback(option);
                        timeoutHandler = null;
                }, delay)
        }
});