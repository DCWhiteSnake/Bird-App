document.addEventListener('DOMContentLoaded', async () => {

    path = window.location.pathname;

     // Add the event listeners
    if (path == '/login.html'){
        document.querySelector("#login_form").addEventListener("submit", await login);  
    }
    else{
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
            }, 10000)
        }
        else {
            fetch("http://localhost:5000/api/login", {
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

    async function logout(event) {
            localStorage.setItem("jwt", null);
            setTimeout(() => {
                window.location.href = "login.html"
            }, 1500);
    }
});
