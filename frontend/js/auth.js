document.addEventListener('DOMContentLoaded', () => {
    // let path = window.location.pathname.split("/");
    // path = "/" + path[path.length - 1]
    let path = window.location.pathname;
    // Add the event listeners for auth events 
    if (path == '/login.html') {
        let jwt = localStorage.getItem("jwt");
        let username = localStorage.getItem('username');
        if (jwt == "" || jwt == "null") {
            document.querySelector("#login_form").addEventListener("submit", login);
        }
        else {
            alert("you are already logged in, redirecting to homepage.");
            setTimeout(() => {
                window.location.href = homeAddress
            }, 3000);
        }
    }

    else if (path == '/register.html') {
        const request = indexedDB.deleteDatabase("tweetsDb");

        request.addEventListener("success",
            (e) => {
                // Have to chain it with deleting the db so
                // these variables don't clear thereby tricking
                // my auth functions.
                console.log("db deleted successfully");
                localStorage.setItem("jwt", "");
                localStorage.setItem("username", "");
                localStorage.setItem("Email", "");
                localStorage.setItem("id", "");

                // finally redirect to login page
            });
        request.addEventListener("error",
            (e) => {
                console.log("no db to delete");
            });
        let registrationForm = document.querySelector("#registration_form");
        var passwordInput = registrationForm.elements["password"];
        var passwordConfirmationInput = registrationForm.elements["confirmation"];


        passwordConfirmationInput.addEventListener('input', () => {
            if (passwordInput.value !== passwordConfirmationInput.value) {
                document.getElementById("confirmation_error").style.display = "block";
            }
            else {
                document.getElementById("confirmation_error").style.display = "none";
            }
        });

        // todo: Add other input validations
        document.querySelector("#registration_form").addEventListener("submit", register);
    }
    else if (path == "/profile.html") {
        let params = new URLSearchParams(window.location.search);
        let profileUsername = params.get("username");

        if (profileUsername != null) {
            let profileLinkElement = document.querySelector("#profile-link");
            profileLinkElement.href = profileAddress + profileUsername;
            let authUsername = localStorage.getItem("username");
            let usernameP = document.querySelector('#username');
            usernameP.textContent = authUsername;
        }

    }
    if (path != '/register.html' && path != '/login.html') {
        // You are probably in an authenticated page
        document.querySelector("#logout_btn").addEventListener("click", logout);
    }

    function login(event) {
        event.preventDefault();
        fetch(loginRoute, {
            method: 'POST',
            body: new FormData(document.querySelector("#login_form"))
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                else {
                    throw new Error("Sorry you can't log in at the time")
                }
            })
            .then(data => {
                let error_message = data["message"]["WWW-Authenticate"];
                let token = data["message"]["token"];
                let username = data["message"]["username"];
                let id = data["message"]["id"];
                if (error_message) {
                    let u_div = document.createElement('div');
                    let u_p = document.createElement('p');
                    let login_div = document.querySelector("#login_div");

                    u_div.id = "unsuccessful_login_div";
                    u_p.id = "unsuccessful_login_p";

                    u_p.textContent = error_message;

                    u_div.appendChild(u_p);
                    login_div.appendChild(u_div);

                    // clear all state data.
                    localStorage.setItem('jwt', "");
                    localStorage.setItem('username', "");
                    localStorage.setItem('Email', "");
                    localStorage.setItem('id', "");

                    // hide the error message div.
                    setTimeout(() => {
                        u_div.style.display = "none";
                    }, 3000);
                }
                else if (token) {
                    // display the successfully created message
                    localStorage.setItem('jwt', token);
                    localStorage.setItem('username', username);
                    localStorage.setItem('id', id);
                    window.location.href = homeAddress;
                }
            })
            .catch(error => {
                console.error('Error:', error.message);
            });
    }
    function register(event) {
        event.preventDefault();
        let registrationForm = document.querySelector("#registration_form");
        let formData = new FormData(registrationForm);
        fetch(registrationRoute, {
            method: 'POST',
            body: formData
        })
            .then((response) => {

                if (response.ok) {
                    return response.json();
                }
            })
            .then((responseJson) => {
                if (responseJson.status == 201) {
                    // Switch to edit profile div
                    localStorage.setItem("email", registrationForm.elements["email"].value);
                    localStorage.setItem("username", registrationForm.elements["username"].value);
                    localStorage.setItem("jwt", responseJson.token);
                    localStorage.setItem("id", responseJson.id);
                    document.querySelector("#registration-container").classList.remove('active');
                    document.querySelector("#onboarding-form-container").classList.add('active');
                    setAutnBio();
                    const updateBioBtn = document.querySelector("#update-bio-btn");
                    updateBioBtn.addEventListener("click", updateBio);
                    const profileImageInput =   document.querySelector("#profile-img-input");
                    profileImageInput.addEventListener("change", displayUploadedImge)
                }
                else {
                    throw new Error(responseJson["WWW-Authenticate"]);
                }

            }).catch((error) => {
                duplicate_email_regex = /unique_email/;
                duplicate_username_regex = /unique_username/;
                if (duplicate_email_regex.test(error)) {
                    document.querySelector("#email_error").classList.remove("hidden");
                    setTimeout(() => {
                        document.querySelector("#email_error").classList.add("hidden");
                    }, 1500);
                }
                else if (duplicate_username_regex.test(error)) {
                    document.querySelector("#username_error").classList.remove("hidden");
                    setTimeout(() => {
                        document.querySelector("#username_error").classList.add("hidden");
                    }, 1500);
                }
                else {
                    let generalErrorP = document.querySelector("#general_error");
                    generalErrorP.textContent = error;
                    generalErrorP.classList.remove("hidden");

                    setTimeout(() => {
                        generalErrorP.classList.add("hidden");
                    }, 1500);
                }
            });
    }
    function logout(event) {
        event.preventDefault();
        const request = indexedDB.deleteDatabase("tweetsDb");

        request.addEventListener("success",
            (e) => {
                console.log("db deleted successfully");
            });

        request.addEventListener("error",
            (e) => {
                console.log("no db to delete");
            });

        // Clear all state data
        localStorage.setItem("jwt", "");
        localStorage.setItem("username", "");
        localStorage.setItem("Email", "");
        localStorage.setItem("id", "");

        setTimeout(() => {
            window.location.href = "login.html"
        }, 1500);

    }
});


function reloadStylesheets() {
    var queryString = '?reload=' + new Date().getTime();
    let currStylesheet = document.querySelector('link[rel*="stylesheet"]');
    currStylesheet.href = currStylesheet.href.replace(/\?.*|$/, queryString);
}