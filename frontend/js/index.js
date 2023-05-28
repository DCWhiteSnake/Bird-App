document.addEventListener("DOMContentLoaded", async () => {
    let jwt = localStorage.getItem("jwt");
    if (jwt == null) {
        setTimeout(() => {
            window.location.href = loginAddress;
        }, 3000)
    }
    else {
        value = await isAuthenticated(jwt)

        if (value) {
            setUsername();
        }
        else {
            localStorage.setItem("jwt", null);
            setTimeout(() => {
                window.location.href = loginAddress;
            }, 3000);
        }
    }

    function setUsername() {
        let jwt = localStorage.getItem("jwt");
        if (jwt == null || jwt == 'null') {
            return Promise.resolve(null);
        }
        return fetch(testNameRoute, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'x-access-token': jwt,
                'Allow': '*'
            },
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Request failed');
                }
            })
            .then(responseData => {
                let username = responseData.username;
                if (username == null || username == "") {
                    alert("Taking you to the login page in 3 seconds")
                    localStorage.setItem("jwt", null);
                    setTimeout(() => {
                        window.location.href = loginAddress;
                    }, 3000);
                }
                let username_span = document.querySelector('#username');
                username_span.textContent = username;
            })
            .catch(error => {
                error('Error:', error);
                alert("Taking you to the login page in 3 seconds")
                localStorage.setItem("jwt", null);
                setTimeout(() => {
                    window.location.href = loginAddress;
                }, 3000)
            });
    }
});
