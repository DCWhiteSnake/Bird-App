# Using flask to make an api
# import necessary libraries and functions
from flask import Flask, jsonify, request, make_response
from flask_socketio import SocketIO, emit, disconnect
from flask_cors import CORS
from cs50 import SQL
from user import User
from werkzeug.security import check_password_hash, generate_password_hash
import uuid
import os
from datetime import datetime, timezone, timedelta
from helpers import token_required
import jwt
import sys
import pika
import time
import os
import json
import utilities

# creating a Flask app
app = Flask(__name__)
cors = CORS(app)
app.config['CORS-HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = os.environ.get('SIO_SECRET')
whoami = os.environ.get('usr_name')
sql_password = os.environ.get("sql_pass")
db = SQL(f"mysql://{whoami}:{sql_password}@localhost:3306/bird_app_db")
sio = SocketIO(app, cors_allowed_origins="*")

# pika
tweets = []
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()


def callback(ch, method, properties, body):
    tweets = jsonify(body.decode)
# Auth


def authenticate(email, password):
    users = db.execute("SELECT * FROM users WHERE email = ?", email)
    if not users:
        users = db.execute("SELECT * FROM users WHERE username = ?", email)
    if not users:
        users = db.execute("SELECT * FROM users WHERE phone_no = ?", email)
    if len(users) == 1:
        user = users[0]
        user_object = User.create_user(user)
        if check_password_hash(user_object.password_hash, password):
            return user_object


@app.route("/api", methods=["GET"])
@token_required
def index(current_user):
    return f"Hi! {current_user.username}"


@app.route("/api/challenge_login", methods=["GET"])
@token_required
def challenge(current_user):
    return jsonify({'username': current_user.username})


@app.route("/api/username", methods=["GET"])
@token_required
def username(current_user):
    return jsonify({'username': current_user.username})


@app.route("/api/login", methods=["POST"])
def login():
    email = request.form.get("email")
    # if not email_is_valid(email):
    #     return jsonify({"WWW-Authenticate": f'Basic realm = "{email}" is not a valid email address'})
    if not email:
        return jsonify({"WWW-Authenticate": f'Basic realm = "{email}" is required'})
    password = request.form.get("password")
    if not password:
        return jsonify({"WWW-Authenticate": 'Basic realm = password cannot be null'})
    user = authenticate(email, password)
    if user:
        app.config['SECRET_KEY']
        token = jwt.encode({'public_id': user.id,
                            'exp': datetime.utcnow() + timedelta(hours=12)
                            }, app.config['SECRET_KEY'])
        return make_response(jsonify({'token': token}), 201)
    return make_response(jsonify({'WWW-Authenticate': 'Invalid username or password'}), 401)


@app.route("/api/register", methods=["POST"])
def register():

    """
    Use this route to register a new user on our amazing bird-app
    """
    email = request.form.get("email")
    username = request.form.get("username")
    phone_no = request.form.get("phone_no")

    if not utilities.email_is_valid(email):
        return jsonify({"WWW-Authenticate": f'"{email}" is not a valid email address'})
    password = request.form.get("password")
    if not password:
        return jsonify({"WWW-Authenticate": 'password cannot be null'})
    confirmation = request.form.get("confirmation")
    if password != confirmation:
        return jsonify({"WWW-Authenticate": 'passwords don\'t match'})

    username = request.form.get("username")
    if not username:
        return jsonify({"WWW-Authenticate": 'you must supply a username'})
    if not phone_no:
        return jsonify({"WWW-Authenticate": 'you must supply a phone_no'})
    id = uuid.uuid4().__str__()
    hash = generate_password_hash(password)
    # format creation date like MYSQL 'YYYY-MM-DD hh:mm:ss' format
    creation_date = datetime.now(timezone.utc).isoformat(sep=",").split(",")
    date = creation_date[0]
    time = creation_date[1].split(".")[0]
    try:
        _ = db.execute("INSERT INTO users(id, email, username, password_hash, creation_date, confirmed, phone_no) VALUES(?,?,?,?,?,?,?)", id, email, username, hash,
                       date+" "+time, 0, phone_no)
        return make_response('Account created successfully', 201)
    except Exception as e:
        print(e)
        return make_response(jsonify({'WWW-Authenticate': str(e).split(',')[1]}), 400)
#end auth

# tweet
@app.route("/api/tweet", methods=["POST"])
@token_required
def create_tweet(current_user, body):

    id = current_user.id
    tweet_id = db.execute("INSERT INTO tweets(id, sender_id, article, time)  VALUES(?,?,?,?)", t_id, id, body,
                          utilities.current_time())
    follower_rows = db.execute(
        "SELECT follower_id FROM links WHERE leader_id = ?", id)
    if follower_rows.count > 0:
        t_id = str(uuid.uuid4())
        # Emit broadcast_tweet message to the tweet producer RabbitMQ server, this
        # tells the server to add the current tweet to the receiver_id node.
        if tweet_id:
            for follower in follower_rows:
                sio.emit('broadcast_tweet', json.dumps(
                    {"sender_id": id, "tweet": body, "receiver_id": follower}))
@sio.on('get_tweets')
def get_tweets(data):
    ''''''
    if data["jwt"]:
        token = data["jwt"]
        token_data = jwt.decode(
            token, app.config['SECRET_KEY'], algorithms=['HS256'])
        receiver_id = token_data['public_id']
        # channel.basic_qos(prefetch_count=1)
        try:
            channel.basic_consume(queue=receiver_id,
                                auto_ack=True, on_message_callback=callback)
            channel.start_consuming()
        except Exception as e:
            e_message = str(e)
            if "no queue" in e_message:
                tweets.append("Nothing to display here, follow some people \
                              to get their tweets")
            
        sio.emit("tweets", tweets)

    else:
        sio.emit("error", "Server error")
#end tweet

# Follow - Unfollow

@app.route("/api/users/follow", methods=["POST"])
@token_required
def followuser(current_user):
    username = request.args.get('username')
    id = current_user.id
    # check if the user already follows 'username'
    # if so then just pass successful else create the link.
    if not username:
        return jsonify(message = {"Follow Error": "username is required"},status=400)
    elif username == current_user.username:
        return jsonify(message = {"Follow Error": "You cannot follow yourself"},status=400)
   
    follower_row = db.execute(
        "SELECT l1.id FROM links JOIN users u1 ON u1.username = ? JOIN users u2 ON u2.id = u1.id JOIN links l1 ON l1.follower_id = ? AND l1.leader_id = u2.id", username, id)
    if id in follower_row:
        return jsonify(message = {"Success": f"Successful followed @{username}"},status=201)
    else:
        leader_id_rows = db.execute(
            "SELECT u1.id FROM users u1 WHERE u1.username = ?", username)
        if not leader_id_rows:
            return jsonify(message = {"Follow Error": f"The user @{username} does not exist"},status=400)
        l_id = leader_id_rows[0]

        link_id = db.execute("INSERT INTO links(id, leader_id, follower_id, time)  VALUES(?,?,?,?)", str(
            uuid.uuid4), l_id, id, utilities.current_time())
        if link_id:
            return jsonify(message = {"Follow success": f"Successfully followed @{username}"},status=201)
    return jsonify(message = {"Follow Error": "Bad Request"},status=400)
#end follow

# Sockets
@sio.on('connect')
def handle_connection():
    '''If the connection event is comming from the the Frontend client
    then request for the JWT stored which will subsequently be validated in theh
    x-access-token event
    '''
    if request.remote_addr == "http://localhost:8080":
        emit('server-client', f'Send access token')
    print(f'Address: {request.remote_addr}\nMessage: Connection successful.')
 
@sio.on('x-access-token')
def handle_token(x_access_token):

    if x_access_token:
        data = jwt.decode(
            x_access_token, app.config['SECRET_KEY'], algorithms=['HS256'])
        public_id = data['public_id']
        user = db.execute("SELECT * FROM users WHERE id = ?", public_id)[0]
        current_user = User.create_user(user)
        emit('username', f'Hello {current_user.username} from the server ')
        emit('Web-Client-Connected', {'id': public_id})
    else:
        sio.emit('disconnect')


@sio.on('disconnect')
def handle_client_message():

    print("client-disconnected")
#end sockets