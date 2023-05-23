# Bird-App
This is a twitter like social media web app.
## Tooling
- MySQL (V8+)
  + You need to create a MYSQL database with the name bird_app_db
  + For the queries used to create the db see [queries](https://github.com/DCWhiteSnake/Bird-App/blob/main/queries.sql "SQL queries")
  + The database, for the ER diagram see [ER diagrams](https://github.com/DCWhiteSnake/Bird-App/blob/main/EntityDiagrams.png "Entity relationship diagrams").
- Django - The backend
- Socket.io - For a persistent communication channel between the client and server.
- Node.js - The front-end
- Bootstrap - For styling similar to twitter's UI.

## Features Documentation
[features docs](https://docs.google.com/document/d/1RQ72CZiRPJc57sB8Fo55bvQZwyeNnT3A826h4QdkBfc/edit?usp=sharing "Features to be implemented")

## Steps to test locally
### Automatic
./run-server

Manual
+ Create your own venv then install the required modules à la **pip install -r requirements.txt**
+ Create an environment variable SIO_SECRET with any value you like via **export SIO_SECRET=some_super_secret_key**
+ Run the websocket-server/api-server with **gunicorn --thread 50 app:app**. You can't use the flask run command as Websocket support is not available for the Werkzeug server, the default flask server.
+ You're good to go, 