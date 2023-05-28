from functools import wraps
import os

from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import jwt
from cs50 import SQL

from user import User

app = Flask(__name__)
cors = CORS(app)
app.config['CORS-HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = os.environ.get('SIO_SECRET')
sql_password = os.environ.get("sql_pass")
db = SQL(f"mysql://dcwhitesnake:{sql_password}@localhost:3306/bird_app_db")

# decorator for verifying the JWT
# Source: https://www.geeksforgeeks.org/using-jwt-for-user-authentication-in-flask/
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # jwt is passed in the request header
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        # return 401 if token is not passed
        if not token:
            return jsonify({'message' : 'Token is missing !!'}), 401
  
        try:
            # decoding the payload to fetch the stored details
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            public_id = data['public_id']
            user = db.execute("SELECT * FROM users WHERE id = ?", public_id)[0]
            current_user =  User.create_user(user)
            
        except:
            return make_response (jsonify({
                'message' : 'Token is invalid !!'
            }), 401)
        # returns the current logged in users context to the routes
        return  f(current_user, *args, **kwargs) 
    return decorated

