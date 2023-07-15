import eventlet
import eventlet.debug

eventlet.monkey_patch()
eventlet.debug.hub_prevent_multiple_readers(False)

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, socketio
from flask_cors import CORS
from cs50 import SQL
from models.user import User
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timezone, timedelta
from helpers import token_required
import jwt, pika, os, json, utilities, uuid, logging
from PIL import Image, UnidentifiedImageError
from models.tweet import tweet

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

def authenticate(identifier, password):
    """Validate the username and password. This function is used by th token_required decorator
       to get a user object associated with the identifier which can be the username, email or phonenumber.
    """
    users = db.execute("SELECT * FROM users WHERE email = ?", identifier)
    if not users:
        users = db.execute("SELECT * FROM users WHERE username = ?", identifier)
    if not users:
        users = db.execute("SELECT * FROM users WHERE phone_no = ?", identifier)
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
        # app.config['SECRET_KEY']
        token = jwt.encode({'public_id': user.id,
                            'exp': datetime.utcnow() + timedelta(hours=12)
                            }, app.config['SECRET_KEY'])
        return jsonify(message={"token": token, "username": user.username, "id": user.id}, status=200)
    return jsonify(message={"WWW-Authenticate": 'Invalid username or password'}, status=401)


@app.route("/api/register", methods=["POST"])
def register():
    """
    Registers a new user on our amazing bird-app
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
        db.execute("INSERT INTO users(id, email, username, password_hash, creation_date, confirmed, phone_no) VALUES(?,?,?,?,?,?,?)", id, email, username, hash,
                       date+" "+time, 0, phone_no)
    except Exception as e:
        message = str(e).split(',')[1]
        print(message)
        return jsonify(message = {'WWW-Authenticate': message}, status = 400)
    user = authenticate(email, password)
    if user:
        token = jwt.encode({'public_id': user.id,
                            'exp': datetime.utcnow() + timedelta(hours=12)
                            }, app.config['SECRET_KEY'])
        return jsonify(message = 'Account created successfully', token = f'{token}', id = id,  status = 201)

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
def follow_user(current_user):
    username = request.args.get('username')
    id = current_user.id
    # check if the user already follows 'username'
    # if so then just pass successful else create the link.
    if not username:
        return jsonify(message={"FollowError": "username is required"}, status=400)
    elif username == current_user.username:
        return jsonify(message={"FollowError": "You cannot follow yourself"}, status=400)
    
    # Check if user already follows
    # if so, just send that the following was successful
    follower_row = db.execute("SELECT l1.follower_id FROM links \
            JOIN users u1 ON u1.username = ? \
            JOIN users u2 ON u2.id = ? \
            JOIN links l1 ON l1.follower_id = u2.id AND l1.leader_id = u1.id", username, id)
    if len(follower_row) == 1:
        return jsonify(message={"Success": f"Already following @{username}"}, status=200)
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

# profile
@app.route("/api/user/profile", methods=["GET", "PATCH"])
def handle_bio():
    
    if request.method == "GET":
        try:
            username = request.args.get("username")
            if not username:
                return jsonify(message={"Bio-Request-Error": f"You must supply a username"}, status=404)
            profile_rows = db.execute("SELECT * FROM users WHERE username=?", username)
            if len(profile_rows) == 1:
                profile = User.create_user(profile_rows[0])
                return jsonify(message={"Profile": str(profile)}, status=200)
            else:
                return jsonify(message={"Bio-Request-Error": f"No such user '{username}'"}, status=404)
        except Exception as e:
            print(e)
            return jsonify(message={"Server-Error": f"Unable to process requests at this time"}, status=503)
    elif request.method == "PATCH":
        # check if the header contains x-access-token and then parse it to extract the user id
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
            profile_address = ""
        # return 401 if token is not passed or a tricky user tries to edit
        # someone else's profile
            try:          
                # decoding the payload to fetch the stored details
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                public_id = data['public_id']
                user = db.execute("SELECT * FROM users WHERE id = ?", public_id)[0]
                current_user = User.create_user(user)
                username = request.form.get("username")
                profile_address = current_user.profile_photo       
            except:
                return jsonify(message={'WWW-Authenticate':'Token is invalid !!'}, status = 401)
            user_id = current_user.id
            # Handle bio update
            new_bio = request.form.get("bio")
            if not new_bio:
                new_bio = current_user.bio
            
            # Handle userName update
            new_username = request.form.get("username")
            if new_username == current_user.username:
                pass
            else:   
                if len(new_username) > 0:
                    username_rows = db.execute("SELECT username from users where username = ?", new_username)
                    if len(username_rows) != 0:
                        return jsonify(message={'username-error':'The username is already taken'}, status = 400)
                else:
                    return jsonify(message={'username-error':'You must supply a username'}, status = 400)

            # Handle profile image update          
            if (request.files["profile-img-input"]):
                    try:
                        extension = ""
                        new_profile_image = Image.open(request.files["profile-img-input"])
                        general_images_path = "../frontend/user_images"
                        os.mkdir(general_images_path)
                    except FileExistsError as e:
                        pass
                    except UnidentifiedImageError:
                        return jsonify(message={"Image-Error": "Unsupported image format"}, status="400")
                    try:
                        new_profile_path = os.path.join(general_images_path, f"{user_id}")
                        os.mkdir(new_profile_path)
                    except FileExistsError as e:
                        pass         
            
                    try: 
                        # Upload photos to client library
                        if new_profile_image.format == "JPEG":
                            extension = ".jpg"
                            profile_address= os.path.join(new_profile_path, user_id + extension)
                            new_profile_image.save(f"{profile_address}",format="JPEG")
                        else:
                            extension = ".png"
                            profile_address= os.path.join(new_profile_path, user_id + extension)
                            new_profile_image.save(f"{profile_address}",format="PNG")


                    # Todo: Use Google drive as a CDN
                    # Create photo for this particular user
                    # requests.post(headers={"Content-type": "application/json",
                    # "Authorization": f"Bearer {g_photos_token}"}, body = Image.open(new_profile_path))
                    except FileExistsError as e:
                        # This means that the user already has a profile image,
                        os.remove(profile_address)
                        new_profile_image.save(f"{profile_address}", path=new_profile_path, format=new_profile_image.format)
                    if(profile_address):
                        profile_address= os.path.join("user_images", user_id, user_id + extension)
                    else:
                        profile_address = current_user.profile_photo

            affected_bio_count = db.execute("UPDATE users SET username = ?, \
                                            bio = ?, profile_photo = ? WHERE id = ?", new_username, new_bio,
                                            profile_address, user_id)
            if (affected_bio_count == 1):
                return jsonify(message={"Success": "Bio updated successfully"}, status=201)
            else:
                return jsonify(message={"Bio-Update-Error": "Sorry cannot update bio at this time"},
                                status = 500)
        else:
            return jsonify(message={"Bio-Update-Error": "Bad Request"}, status = 400)

@app.route("/api/user/tweets", methods=["GET", "DELETE"])
def handle_user_tweets():
    if request.method == "GET":
        page_size = 10
        page = int(request.args["pageNumber"])
        request_username = request.args["username"]
        try:

            tweet_db_rows  = db.execute("SELECT article as tweet, users.id as receiver_id, time, tweets.id as id FROM tweets JOIN users on users.id = tweets.sender_id AND users.username = ? ORDER BY time DESC LIMIT ? OFFSET ? ", request_username, 3, 3 * page)
            if len(tweet_db_rows) > 0:
                tweet_rows = [tweet(t["tweet"], t["receiver_id"], request_username, t["time"], t["id"]) for t in tweet_db_rows]
                #tweets_json = json.dumps(tweet_rows)

                tweets_json = [str(tweet_obj) for tweet_obj in tweet_rows]
                return jsonify(message={"tweets": tweets_json}, status = 200)
            else:
                return jsonify(message={"tweets": []}, status=200)
        except:
            return jsonify(message={"Bad Request": "This user doesn't exist"}, status=404)
    if request.method == "DELETE":
        return jsonify(message="Ok", status = 200)
    
@app.route("/api/user/profile/image", methods=["GET"])
def get_ImageLink():
    username = request.args.get("username")
    if username:
        try:
            print(username)
            profile_photh_rows = db.execute("SELECT profile_photo FROM users WHERE username = ?", username)
            if len(profile_photh_rows) == 1:
                print(profile_photh_rows[0]["profile_photo"])
                return jsonify(message={"profile_photo":profile_photh_rows[0]["profile_photo"]}, status=200)
            else:
                return jsonify(status = 404)
        except Exception as e:
                print(e)
                return jsonify(message=str(e), status = 500)
    else:
        return jsonify(message="Bad Request",  status = 404)
# end profile


@app.route("/api/user/followers", methods=["GET"])
def handle_user_followers():
    if request.method == "GET":
        page_size = 10
        page = int(request.args["pageNumber"])
        request_username = request.args["username"]
        try:

            follower_rows  = db.execute("SELECT u1.username, u1.bio, u1.profile_photo, u1.id as id FROM links l1 \
                                        JOIN users u1 ON u1.id = l1.follower_id \
                                        JOIN users u2 on u2.id = l1.leader_id and u2.username= ? \
                                        ORDER BY l1.time ASC LIMIT ? OFFSET ?", request_username, page_size, page_size * page)
            if len(follower_rows) > 0:
                follower_rows = [User(bio = followers["bio"], username = followers["username"],
                                    profile_photo = followers["profile_photo"], id = followers["id"], email = "", phone_no = "",
                                    password_hash = "", creation_date = "", follower_count = "", following_count = "", confirmed = "",
                                    cash = "", tweets_count = "") for followers in follower_rows]
                followers_json = [str(userObject) for userObject in follower_rows]
                return jsonify(message={"followers": followers_json}, status = 200)
            else:
                return jsonify(message={"followers": []}, status=200)
        except:
            return jsonify(message={"Bad Request": "This user doesn't exist"}, status=404)

@app.route("/api/user/following", methods=["GET"])
def handle_user_following():
    if request.method == "GET":
        page_size = 3
        page = int(request.args["pageNumber"])
        request_username = request.args["username"]
        try:

            following_rows  = db.execute("SELECT u1.username, u1.bio, u1.profile_photo, u1.id as id FROM links l1 JOIN users u1 ON u1.id = l1.leader_id JOIN\
                                         users u2 on u2.id = l1.follower_id and u2.username= ? LIMIT ? OFFSET ?", request_username, page_size, 3 * page)
            if len(following_rows) > 0:
                following_rows = [User(bio=following["bio"], username= following["username"],
                                      profile_photo= following["profile_photo"], id = following["id"], email = "", phone_no = "", password_hash = "", creation_date = "",
                                        follower_count = "", following_count = "", confirmed = "", cash = "", tweets_count="") for following in following_rows]
                following_json = [str(userObject) for userObject in following_rows]
                return jsonify(message={"following": following_json}, status = 200)
            else:
                return jsonify(message={"following": []}, status=200)
        except:
            return jsonify(message={"Bad Request": "This user doesn't exist"}, status=404)
# end profile

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
        try:
            data = jwt.decode(
                x_access_token, app.config['SECRET_KEY'], algorithms=['HS256'])
            public_id = data['public_id']
        
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