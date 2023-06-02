import pika, socketio, sys, os
from tweet import tweet
sio = socketio.Client()
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
body = "{}"

@sio.event
def connect():
    print('connection established')
    #sio.emit('get_tweets', {'response': ''})

@sio.on('Web-Client-Connected')
def Web_Client_Connected():

    '''When the web client is connected'''
    print('Web Client connected')

@sio.on('broadcast_tweet')
def broadcast_tweet(data):
    """ Receive json fromatted tweet data and then publish to a rabbitMQ queue"""
    print('message received')
    body = tweet.create_from_json(data)
    receiver_id = body.receiver_id

    #Queue declaration is idempotent, so tweets will be stored chronologically under
    #a queue named user_id
    channel.queue_declare(body.receiver_id)
    channel.basic_publish(exchange='',
                          routing_key = receiver_id,
                          body= str(body))
    sio.emit('message_stored', {'response': 'Successful'})


@sio.event
def disconnect():
    print('disconnected from server')

def main():
    sio.connect('http://localhost:5000')
    sio.wait()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrupted')
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
