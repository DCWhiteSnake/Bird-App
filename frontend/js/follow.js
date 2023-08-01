document.addEventListener("DOMContentLoaded", () => {
        const followersContainer = document.querySelector("#followers-container");
        const followingContainer = document.querySelector("#following-container");
        const followersLinkContainer = document.querySelector("#followers-link-container");
        const followingLinkContainer = document.querySelector("#following-link-container");
        const blueThingy = document.createElement("div");
        let reFetch = true;
        let followersPageNum = -1, followingPageNum = -1;
        const params = new URLSearchParams(window.location.search);
        let option = params.get("opt");
        let paramsUsername = params.get("username");
        const profileLink = document.querySelector("#profile-link");
        profileLink.href = window.location.search;
        let target_list = [];
        /**
        * getOptionList - Displays the list of users defCol2Container on
        * the option
        * @param {} option:  one of followers | following
        */
        const getOptionList = (option) => {
                increaseOptionCount(option);
                let pageNumber = (option == "followers") ? followersPageNum : followingPageNum;

                fetch(baseRoute + "user/" + option + "?username=" + paramsUsername
                        + `&pageNumber=${pageNumber}`, { headers: { "x-access-token": localStorage.getItem("jwt") } })
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
                                        let usersList = responseJson.message[option];
                                        let followsYouList;
                                        let contextual_links_dict;
                                        if (localStorage.getItem("username")) {
                                                contextual_links_dict = responseJson.
                                                        message["contextual_links_dict"]
                                        }
                                        if (usersList.length > 0) {
                                                reFetch = true
                                                usersList.forEach((userRow) => {
                                                        const user = JSON.parse(userRow);
                                                        // lvOneRow
                                                        const lvOneRow = document.createElement("div");
                                                        const fCol1 = document.createElement("div");
                                                        lvOneRow.classList.add("row", "py-2");
                                                        lvOneRow.appendChild(fCol1);
                                                        fCol1.classList.add("col-2");
                                                        fCol1.appendChild(createProfileImgContainer(user));
                                                        const fCol2 = document.createElement("div");
                                                        const fCol2Container = document.createElement("div");
                                                        fCol2.classList.add("col-10");
                                                        lvOneRow.appendChild(fCol2);
                                                        fCol2Container.classList.add("row")
                                                        fCol2.appendChild(fCol2Container);
                                                        const greyName = createGreyName(user);
                                                        const namesContainer = createNamesContainer(user, createBlackName(user), greyName);
                                                        fCol2Container.appendChild(namesContainer);
                                                        if (contextual_links_dict[user.id].follows_u == true) {
                                                                let followsYouBtn = document.createElement("button");
                                                                followsYouBtn.textContent = "Follows you";
                                                                followsYouBtn.disabled = true;
                                                                followsYouBtn.classList.add("follows-you-btn");
                                                                greyName.appendChild(followsYouBtn);
                                                        }

                                                        const funcBtnsContainer = document.createElement("div");
                                                        funcBtnsContainer.classList.add("col-4", "py-2");

                                                        const unfollowBtn = createunfollowBtn(user, target_list);
                                                        unfollowBtn.addEventListener("click", (e) => {
                                                                target_list.push("uf-btn");
                                                                unfollow(e.target.getAttribute("data-id"))
                                                                        .then((status) => {
                                                                                if (status) {
                                                                                        funcBtnsContainer.removeChild(unfollowBtn);
                                                                                        funcBtnsContainer.prepend(followBtn);
                                                                                }
                                                                        });
                                                        });
                                                        const followBtn = createFollowBtn(user, funcBtnsContainer);
                                                        followBtn.addEventListener("click", (e) => {
                                                                target_list.push("f-btn");
                                                                follow(e.target.getAttribute("user-id"))
                                                                        .then((success) => {
                                                                                if (success) {
                                                                                        funcBtnsContainer.removeChild(followBtn);
                                                                                        funcBtnsContainer.prepend(unfollowBtn)
                                                                                }
                                                                        });
                                                        });
                                                        funcBtnsContainer.appendChild(createOptBtn());
                                                        if (contextual_links_dict[user.id].u_follow == true) {
                                                                funcBtnsContainer.prepend(unfollowBtn);
                                                        }
                                                        else {
                                                                if (user.username != localStorage.getItem("username")) {
                                                                        funcBtnsContainer.prepend(followBtn);
                                                                }
                                                        }
                                                        fCol2Container.appendChild(funcBtnsContainer);
                                                        fCol2Container.appendChild(createBioRow(user));
                                                        const profileContainer = createProfileContainer(user, target_list)
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
                                                });
                                        }
                                        else {
                                                reFetch = false;
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
        // The function of this block is to add object to a scrollable container/s defCol2Container on
        // increasing scrolls. It gives a repeated output
        document.querySelectorAll(".link-container").forEach((container) => {

                container.addEventListener('scroll', (e) => {
                        if (isScrollEnd(e))
                                addSubsequentUsers(getOptionList, 100, option);
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
        /**
         * isScrollEnd - Checks if the user has reached the end of the scrollable area
         * @returns - true if the scroll bar reaches the end of the scrollable area and 
         * - false otherwise.
         */
        function isScrollEnd(e) {
                var element = e.target;
                var scrollTop = element.scrollTop;
                var scrollHeight = element.scrollHeight;
                var clientHeight = element.clientHeight;
                var bool = (Math.abs(scrollHeight - scrollTop - clientHeight) < 1) && reFetch == true;
                // Check if the user has scrolled to the bottom of the scrollable area
                if (bool) {
                        console.log("true");
                }
                return bool;
        }
        /**
         * increaseOptionCount - Increases the page number for getting follower and following list.
         * This function is used in conjunction with the {@link isScrollEnd} function to create endless
         * follow list scroll (if you have that many followers 😉).
         * @param {*} option the context to increase
         * @return Nothing. Just performs a function.
         */
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
        /**
         * Adds more users to the respective containers.
         * @param {*} callback - {@link getOptionList}
         * @param {*} delay - Since scroll events are too fast, add some delay between scrolls
         * @param {*} option - the context (followers | following) to add users to.
         */
        const addSubsequentUsers = (callback, delay, option) => {
                let timeoutHandler = null;
                if (timeoutHandler) {
                        clearTimeout(timeoutHandler);
                }
                timeoutHandler = setTimeout(() => {
                        callback(option);
                        timeoutHandler = null;
                }, delay)
        }

        // SEARCH BAR
        document.addEventListener("input", createMiniProfileList);
});




/**
 * createProfileContainer - Create a html div element whose function is to redirect to the profile
 * of the user in the click context.
 * @returns A div that is clickable
 */
function createProfileContainer(user, target_list) {
        const profileContainer = document.createElement("div");
        profileContainer.classList.add("container", "profile-node");
        profileContainer.setAttribute("data-username", user.username);

        profileContainer.addEventListener("click", (e) => {
                if (!target_list.pop()) {
                        window.location.href = profileAddress + user.username;
                }
        })

        return profileContainer
}
/**
 * createNamesContainer - Create a html div element whose function is to house user names.
 * of the user in the click context.
 * @returns A styled div that contains user names
 */
function createNamesContainer(user, blackName, greyName) {
        const namesContainer = document.createElement("div");
        namesContainer.classList.add("col-8"); 
        namesContainer.appendChild(blackName);
        namesContainer.appendChild(greyName);
        return namesContainer;
}

/**
 * createGreyName - create a paragraph element that houses the username in color gray
* @returns A styled paragraph element that contains the username
*/
function createGreyName(user)
{
        const greyName = document.createElement("p");
        greyName.classList.add("name", "username-grey");
        greyName.textContent = "@" + user.username + " ";
        return greyName;
}
/**
 * createBlackName - create a paragraph element that houses the user's display in color black
* @returns A styled paragraph element that contains the user's display name
*/
function createBlackName(user)
{
        const blackName = document.createElement("p");
        blackName.classList.add("name", "username-black");
        blackName.textContent = user.username;
        return blackName;
}       
/**
* createBioRow - Create a div that contains the user's bio
* @returns A styled div that contains the user's bio
*/
function createBioRow(user) {
        const bioRow = document.createElement("div");
        bioRow.classList.add("col-12");
        const bioPara = document.createElement("p");
        bioPara.textContent = user.bio;
        bioRow.appendChild(bioPara);
        return bioRow;
}
/**
* createProfileImgContainer - Create a div that contains the user's profile image
* @returns - A circular container that contains the default image if the user has no image 
* - A circular container that contains the user's profile image.
*/
function createProfileImgContainer(user)
{
        const profileImgContainer = document.createElement("div");
        profileImgContainer.classList.add("profile-img-container-sm")
        const profileImg = document.createElement("img");
        profileImg.src = (user.profile_photo == null) ?
                "/img/default_profile.png" : user.profile_photo + `?${new Date().getTime()}`;
        profileImg.alt = "Profile Image";
        profileImg.classList.add("profile-img-sm");
        profileImgContainer.appendChild(profileImg);
        return profileImgContainer;
}