# Using flask to make an api
# import necessary libraries and functions
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS, cross_origin
import os
# creating a Flask app
app = Flask(__name__)
cors = CORS(app)
app.config['CORS-HEADERS'] = 'Content-Type'
app.config['SECRET_KEY'] = os.environ.get('SIO_SECRET')
sio = SocketIO(app, cors_allowed_origins="*")

@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

@sio.on('connect')
def handle_connection():
	emit('server-client', 'Bird app notification is getting ready to sail')

@sio.on('client-server')
def handle_client_message(msg):
	print("\n" + str(msg))


@app.route("/")
def index():
	return "Index page"

@app.route("/api/greet")
def greet():
	data = {"data":"Hi there David!"}
	return jsonify(data)
