document.addEventListener('DOMContentLoaded', async () => {

    path = window.location.pathname;

    // Add the event listeners for auth events
    if (path == '/login.html') {
        document.querySelector("#login_form").addEventListener("submit", await login);
    }
    else if (path == '/register.html') {

        let jwt = localStorage.getItem("jwt")
        // if someone was previously on the browser, clear the jwt.
        if (jwt != "null") {
            localStorage.setJwt(null);
        }
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
        document.querySelector("#registration_form").addEventListener("submit", await register);
    }
    else {
        // You are probably in an authenticated page
        document.querySelector("#logout_btn").addEventListener("click", await logout);
    }

    async function login(event) {
        event.preventDefault()
        let jwt = localStorage.getItem("jwt")
        let username = await isAuthenticated(jwt);
        if (username !== null) {
            // Redirect the user to their home page
            alert("you are already logged in, redirecting to homepage.");
            setTimeout(() => {
                window.location.href = "index.html"
            }, 3000);
        }
        else {
            await fetch(loginRoute, {
                method: 'POST',
                body: new FormData(document.querySelector("#login_form"))
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    else {
                        throw new Error('Request failed')
                    }
                })
                .then(responseData => {
                    localStorage.setItem('jwt', responseData.token);
                    window.location.href = homeAddress
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
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
                document.querySelector("#email_error").style.display = "none";
                document.querySelector("#general_error").textContent = "none";
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
                        else if(duplicate_username_regex.test(error)){
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
        }}

        async function logout(event) {
            localStorage.setItem("jwt", null);
            setTimeout(() => {
                window.location.href = "login.html"
            }, 1500);
        }
    });
