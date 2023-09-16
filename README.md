# Bird-App
This is a twitter like social media web app.
## Tooling
- MySQL (V8+)
  + You need to create a MYSQL database with the name bird_app_db
  + For the queries used to create the db see [queries](https://github.com/DCWhiteSnake/Bird-App/blob/main/queries.sql "SQL queries")
  + The database, for the ER diagram see [ER diagrams](https://github.com/DCWhiteSnake/Bird-App/blob/main/EntityDiagrams.png "Entity relationship diagrams").
  Added an architecture diagram [Architecture Diagram](https://github.com/DCWhiteSnake/Bird-App/blob/main/Architecture.png "Architecture diagram") 
- Flask - The backend
- Socket.io - For a persistent communication channel between the client and server. Socket.io is an extension of Websockets technology
- Gunicorn - HTTP server
- Eventlet - Worker class
- js - The front-end
- Bootstrap - For styling
- Python 3.9.16
- 
## Steps to test locally
### Automatic
- create a database called bird_app_db
- run the schema creation scripts in queries.sql
- chmod u+x *.sh && ./run-server.sh

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
If using WSL, it must be version 2, if not gevent won't run correctly. You can check the version via **wsl -l -v** in a powershell terminal.
