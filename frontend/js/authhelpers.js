async function isAuthenticated(jwt) {
    /**
     * Check if the user making the request is authenticated.
     * returns a promise that resolves to the username if authenticated
     * and null if not authenticated
     */
    try {
        const response = await fetch(challengeLoginRoute, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': jwt,
                'Allow': '*'
            }
        });

        if (response.ok) {
            const responseData = await response.json();
            const username = responseData.username;
            console.log(username);
            return username;
        } else {
            throw new Error("Something went wrong");
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}
