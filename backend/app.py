# Using flask to make an api
# import necessary libraries and functions
import eventlet
import eventlet.debug
eventlet.monkey_patch()
eventlet.debug.hub_prevent_multiple_readers(False)
from flask import Flask, jsonify, request, make_response
from flask_socketio import SocketIO, emit, disconnect, socketio
from flask_cors import CORS
from cs50 import SQL
from models.user import User
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timezone, timedelta
from helpers import token_required
import jwt, pika, os, json, utilities, uuid, logging

# creating a Flask app
app = Flask(__name__)
cors = CORS(app)
app.config['CORS-HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = os.environ.get('SIO_SECRET')
whoami = os.environ.get('usr_name')
sql_password = os.environ.get("sql_pass")
db = SQL(f"mysql://{whoami}:{sql_password}@localhost:3306/bird_app_db")
mgr = socketio.KombuManager('amqp://')
sio = SocketIO(app, cors_allowed_origins="*", client_manager=mgr, async_mode='eventlet')
logging.getLogger("pika").setLevel(logging.WARNING)
#  Setup
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

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
    return jsonify({'username': current_user.username, "status": 200})


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
        return jsonify(message={"WWW-Authenticate": 'Email is required'}, status=401)
    password = request.form.get("password")
    if not password:
        return jsonify(message={"WWW-Authenticate": 'Password cannot be null'}, status=401)
    user = authenticate(email, password)
    if user:
        app.config['SECRET_KEY']
        token = jwt.encode({'public_id': user.id,
                            'exp': datetime.utcnow() + timedelta(hours=12)
                            }, app.config['SECRET_KEY'])
        return jsonify(message={"token": token, "username": user.username, "id": user.id}, status=200)
    return jsonify(message={"WWW-Authenticate": 'Invalid username or password'}, status=401)


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
# end auth

# tweet


@app.route("/api/tweet", methods=["POST"])
@token_required
def create_tweet(current_user):

    # id = jwt.decode(request.headers['x-access-token'], app.config['SECRET_KEY'], algorithms=['HS256'])\
    # ['public_id']
    # mod_body = body
    # print(mod_body)
    jwt = request.headers["x-access-token"]
    body = request.form.get('tweet')
    if (len(body) == 0):
        return jsonify(message={"TweetError": f"Bad Request"}, status=400) 
    id = current_user.id
    t_id = str(uuid.uuid4())
    
    tweet_id = db.execute("INSERT INTO tweets(id, sender_id, article, time)  VALUES(?,?,?,?)", t_id, id, body,
                          utilities.current_time())
    user_follower_list = db.execute(
        "SELECT follower_id, u1.username as f_username, u2.username  as l_username FROM links l1 JOIN users u1\
              ON u1.id = l1.follower_id AND l1.leader_id=? JOIN users u2 ON u2.id = l1.leader_id", id)
    if len(user_follower_list) > 0:
        # Emit broadcast_tweet message to the tweet producer RabbitMQ server, this
        # tells the server to add the current tweet to the receiver_id node.
        for follower_row in user_follower_list:
            sio.emit('broadcast_tweet', json.dumps(\
                {"tweet": [body, utilities.current_time(), t_id], "receiver_id": follower_row["follower_id"],
                 "leader_username":  follower_row["l_username"]}))
            sio.emit(f"new_tweet", follower_row["f_username"])
    return jsonify(message={"Success": f"Tweet sent successfully"}, status=201)
    


@sio.on('get_tweets')
def get_tweets(data):
    ''''''
    def callback(ch, method, properties, body):
    
        tweets = f"{body.decode('utf-8')}"
        # tweets = jsonify(tweets)
        sio.emit(f"tweets", {"tweets":tweets, "token":receiver_id})
    if data["jwt"]:
        token = data["jwt"]
        token_data = jwt.decode(
            token, app.config['SECRET_KEY'], algorithms=['HS256'])
        receiver_id = token_data['public_id']
        
        connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
        channel = connection.channel()
        if connection.is_closed:
            connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
            channel = connection.channel()

        try:
            channel.queue_declare(queue=receiver_id)
            channel.basic_consume(queue=receiver_id,
                                      auto_ack=True,
                                      on_message_callback=callback)
        
            channel.start_consuming()
        except Exception as e:
            print(e)
# end tweet

# Follow - Unfollow


@app.route("/api/users/follow", methods=["POST"])
@token_required
def followuser(current_user):
    username = request.args.get('username')
    id = current_user.id
    # check if the user already follows 'username'
    # if so then just pass successful else create the link.
    if not username:
        return jsonify(message={"Follow Error": "username is required"}, status=400)
    elif username == current_user.username:
        return jsonify(message={"Follow Error": "You cannot follow yourself"}, status=400)
    # Check if user already follows
    # if so, just send that the following was successful
    follower_row = db.execute("SELECT l1.id FROM links \
            JOIN users u1 ON u1.username = ? \
            JOIN users u2 ON u2.id = u1.id \
            JOIN links l1 ON l1.follower_id = ? AND l1.leader_id = u2.id", username, id)
    if len(follower_row) == 1:
        return jsonify(message={"Success": f"Successful followed @{username}"}, status=201)
    else:
        leader_id_rows = db.execute(
            "SELECT u1.id FROM users u1 WHERE u1.username = ?", username)
        if not leader_id_rows:
            return jsonify(message={"FollowError": f"The user @{username} does not exist"}, status=400)
        l_id = leader_id_rows[0]["id"]
        _ = db.execute("INSERT INTO links(id, leader_id, follower_id, time)  VALUES(?,?,?,?)", str(
            uuid.uuid4), l_id, id, utilities.current_time())
        return jsonify(message={"Success": f"Successfully followed @{username}"}, status=201)
# end follow

# Sockets
@sio.on('connect')
def handle_connection():
    '''If the connection event is comming from the the Frontend client
    then request for the JWT stored which will subsequently be validated in the
    x-access-token event
    '''
    emit('server-client', f'Send access token')

@sio.on('x-access-token')
def handle_token(x_access_token):

    if x_access_token:
        data = jwt.decode(
            x_access_token, app.config['SECRET_KEY'], algorithms=['HS256'])
        public_id = data['public_id']
        try:
            user = db.execute("SELECT * FROM users WHERE id = ?", public_id)[0]
            current_user = User.create_user(user)
            emit('username', f'Hello {current_user.username} from the server ')
            emit('Web-Client-Connected', {'id': public_id})
        except:
            pass

    else:
        sio.emit('disconnect')


@sio.on('disconnect')
def handle_client_message():
    client_add = request.remote_addr  + ":" + str(request.environ['REMOTE_PORT'])
    print(f"Client: {client_add} has disconnected disconnected")
# end sockets