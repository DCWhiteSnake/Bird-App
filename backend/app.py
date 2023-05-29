# Using flask to make an api
# import necessary libraries and functions
from flask import Flask, jsonify, request, make_response
from flask_socketio import SocketIO, emit, disconnect
from flask_cors import CORS
from cs50 import SQL
from user import User
from werkzeug.security import check_password_hash, generate_password_hash
import re
import uuid
import os
from datetime import datetime, timezone, timedelta
from helpers import token_required
import jwt

# creating a Flask app
app = Flask(__name__)
cors = CORS(app)
async_mode = None
app.config['CORS-HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = os.environ.get('SIO_SECRET')
whoami = os.environ.get('usr_name')
sql_password = os.environ.get("sql_pass")
db = SQL(f"mysql://{whoami}:{sql_password}@localhost:3306/bird_app_db")
sio = SocketIO(app, cors_allowed_origins="*", async_mode=async_mode)
email_regex = re.compile(
    r'([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+@[A-Za-z0-9-]+(\.[A-Z|a-z]{2,})+')

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

@sio.on('connect')
def handle_connection():
    emit('server-client', f'Send access token')

@sio.on('x-access-token')
def handle_token(x_access_token):
    if  x_access_token:
            data = jwt.decode(x_access_token, app.config['SECRET_KEY'], algorithms=['HS256'])
            public_id = data['public_id']
            user = db.execute("SELECT * FROM users WHERE id = ?", public_id)[0]
            current_user =  User.create_user(user)
            emit('username', f'Hello {current_user.username} from the server ')
    else:
        sio.emit('disconnect')

@sio.on('disconnect')
def handle_client_message():
    print("client-disconnected")


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
    username= request.form.get("username")
    phone_no = request.form.get("phone_no")
    if not email_is_valid(email):
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


def email_is_valid(email):
    if (re.fullmatch(email_regex, email)):
        return True
    return False