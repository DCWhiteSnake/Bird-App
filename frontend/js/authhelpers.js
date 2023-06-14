/**
 * Queries the backend server for the username of the jwt stored in 
 * localStorage.
 * @returns {Boolean} true if the jwt is valid 
 * and false otherwise
 */
async function CheckIfJWTIsValid(jwt) {
    const response = await
        fetch(challengeLoginRoute, {method: "GET", headers:{
            "x-access-token":jwt
        }});
    if (response.ok){
        const jsonData = await response.json();
        const message = jsonData.message;
        console.log(message);
        // do something with the message later.
        if (jsonData.status == 401) {
            // if we get a 401 - Unauthorized status message
            // return false;
            return false;
        }
        else{
            return true;
        }
    }
    return false;

}