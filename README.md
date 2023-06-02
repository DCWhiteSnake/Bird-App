# Bird-App
This is a twitter like social media web app.
## Tooling
- MySQL (V8+)
  + You need to create a MYSQL database with the name bird_app_db
  + For the queries used to create the db see [queries](https://github.com/DCWhiteSnake/Bird-App/blob/main/queries.sql "SQL queries")
  + The database, for the ER diagram see [ER diagrams](https://github.com/DCWhiteSnake/Bird-App/blob/main/EntityDiagrams.png "Entity relationship diagrams").
- Flask - The backend
- Socket.io - For a persistent communication channel between the client and server. Socket.io is an extension of Websockets technology
- Gunicorn - Reverse proxy
- Eventlet - Worker
- js - The front-end
- Bootstrap - For styling similar to twitter's UI.
- Python 3.9.16

## Features Documentation
[features docs](https://docs.google.com/document/d/1RQ72CZiRPJc57sB8Fo55bvQZwyeNnT3A826h4QdkBfc/edit?usp=sharing "Features to be implemented")

## Steps to test locally
### Automatic
- create a database called bird_app_db
- chmod u+x *.sh && ./run-server.sh
- remember to inspect the shell scripts for malicious code.

### Manual
- For backend server 
  + Cd into the backend folder
  + Create your own venv then install the required modules à la **pip install -r requirements.txt**
  + Create an environment variable SIO_SECRET with any value you like via **export SIO_SECRET=some_super_secret_key**
  + Run the websocket-server/api-server with **gunicorn --thread 50 app:app**. You can't use the flask run command as Websocket support is not available for the Werkzeug server, the default flask server.
  + You're good to go
- For the frontend server
  + cd into the frontend folder and just run **http-server**
- You are good to go.


#Note
If using WSL, it must be version if not gevent won't run correctly. You can check the version via **wsl -l -v** in a powershell terminal.

#Note Update: 6-2-2023
The current commit introduces some breaking changes specifically with the start_backend_server.sh script and the run_p.sh script. Below is a supplementary guide to running the app
- export sql_pass="insert your sql password here" && export SIO_SECRET="secretstuff2"
- export usr_name=$(whoami)
- cd into backend folder then **flask run**
- cd into backend in another terminal then **python tweet_producer.py**
- cd into frontend in another terminal then http-server.
Functionality added:
 - Ability to follow user by searching for name
 - Functionality to get tweets from people you follow (buggy)
 - Touch up the style and elements on the webapp
 - Backend flow to get tweets and then broadcast to followers.