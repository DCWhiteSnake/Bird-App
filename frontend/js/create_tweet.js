document.addEventListener("DOMContentLoaded", async() => {
document.querySelector("#create_tweet_form").addEventListener('submit', send_tweet)

function send_tweet(event){
    event.preventDefault();
    let jwt = localStorage.getItem("jwt")
    let form = document.querySelector("#create_tweet_form")
    if (jwt != null && document.querySelector("#tweet_input") != null){
        fetch(sendTweetRoute, {
            method: 'POST',
            headers: {'x-access-token': jwt},
            body: new FormData(form)
        })
        .then(response => {
            if (response.ok) {
                // Show the user that the tweets were sent successfully, 
                const tweet_response_block = document.createElement("div");
                document.querySelector("#create_tweet_container").appendChild(tweet_response_block);
                const message_p = document.createElement("p");
                message_p.textContent = "Tweet Sent Successfully";
                tweet_response_block.appendChild(message_p);
                // hide after 3 seconds
                setTimeout(() => {
                   message_p.style.display = "none";
                }, 3000);
                
                // Finally clear the form
                form.childNodes.entries["tweet_input"].textContent = "";
            }
            else {
                throw new Error('Request failed')
            }
        })
        .catch((error) => {
            alert(`Sorry, can't send tweets at this time \nError: ${error.message}`);
        });
    }
}
})