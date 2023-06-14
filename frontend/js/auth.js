document.addEventListener('DOMContentLoaded', () => {
    path = window.location.pathname;
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
        // localStorage.setItem("jwt", "");
        // localStorage.setItem("Email", "");
        // localStorage.setItem("username", "")
        // do some client-side input validation
        let registrationForm = document.querySelector("#registration_form");
        var passwordInput = registrationForm.elements["password"];
        var passwordConfirmationInput = registrationForm.elements["confirmation"];
        var emailInput = registrationForm.elements["email"];
        var usernameInput = registrationForm.elements["email"];
        var phoneNoInput = registrationForm.elements["email"];

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
    else if (path = "/profile.html")
    {
        const params = new URLSearchParams(window.location.search);
        const username = params.get("username");

        if (username != null)
        {
            
        }
    
    }
    else {
        // You are probably in an authenticated page
        document.querySelector("#logout_btn").addEventListener("click", logout);
    }

    async function login(event) {
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
    async function register(event) {
        event.preventDefault();
        let registrationForm = document.querySelector("#registration_form");
        let formData = new FormData(registrationForm);
        try {
            let response = await fetch(registrationRoute, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                localStorage.Email = registrationForm.elements["email"].value;
                window.location.href = registrationSuccessfulAddress;
            }
            else {
                return response.json()
                    .then(error => {
                        // Error comes in the format 'WWW-Authenticate: error message'
                        throw new Error(error['WWW-Authenticate']);
                    }).catch(error => {
                        // Unnecessary use of regex to parse error message for message that looks
                        // like it address email duplication
                        // After parsing get the top div and put the error message above
                        duplicate_email_regex = /unique_email/;
                        duplicate_username_regex = /unique_username/;
                        if (duplicate_email_regex.test(error)) {
                            document.querySelector("#email_error").style.display = "block";
                        }
                        else if (duplicate_username_regex.test(error)) {
                            document.querySelector("#username_error").style.display = "block";
                        }
                        else {
                            document.querySelector("#general_error").textContent = error;
                        }
                    });
            }
        }

        catch (error) {
            document.querySelector("#general_error").textContent = error
        }
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

    function setProfileTweets(){
            // todo
    }
    function setProfileBio(){
        // todo
    }
    function createFollowButton(){
        // todo
    }

});
