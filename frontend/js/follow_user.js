document.addEventListener("DOMContentLoaded", async() => {
document.querySelector("#follow_user_form").addEventListener('submit', follow)

function follow(event){
    event.preventDefault();
    let jwt = localStorage.getItem("jwt");
    let form = document.querySelector("#follow_user_form");
    let username = document.querySelector("#f_username").value;
    if (jwt != null &&  username != null){
        fetch(followUserRoute + `?username=${username}`, {
            method: 'POST',
            headers: {'x-access-token': jwt},
            body: new FormData(form)
        })
        .then(response => {
            if (response.ok) {
                // Show the user that the tweets were sent successfully,
                data = response.json();
                return data;
            }
        })
        .then(data => {
            error_message = data["message"]["Follow Error"]
            success_message = data ["message"]["Success"]
            if (error_message){
                let u_div = document.createElement('div');
                let u_p = document.createElement('p');
                u_div.id = "unsuccessful_follow_div";
                u_p.id = "unsuccessful_follow_p";
                u_p.textContent = error_message;
                u_div.appendChild(u_p);
                let follow_div = document.querySelector("#follow_div")   
                follow_div.appendChild(u_div);
                
                setTimeout(() => {
                   u_div.style.display="none"; 
                }, 3000);
            }
            else if (success_message)
            {
                // display the successfully created message
                let s_div = document.createElement('div');
                let s_p = document.createElement('p');
                s_div.id = "successful_follow_div";
                s_p.id = "successful_follow_p";
                s_p.textContent = success_message;
                s_div.appendChild(s_p);
                let follow_div = document.querySelector("#follow_div")   
                follow_div.appendChild(s_div);
                
                setTimeout(() => {
                   s_div.style.display="none"; 
                }, 3000);
            }
            else{
                throw new Error(`Sorry, can't follow users at this time \nError: ${error.message}`);
            }
            console.log(data);
        
        })
        .catch((error) => {
            alert(error.message);
        });
    }
}
})