from app import sio, app
from flask_socketio import SocketIO
from eventlet import wsgi, listen
# if __name__ == '__main__':
#     # sio.run(app)
if __name__ == '__main__':
# wrap Flask application with socketio's middleware
    app = SocketIO.Middleware(sio, app)

    # deploy as an eventlet WSGI server
    wsgi.server(listen(('', 5000)), app)