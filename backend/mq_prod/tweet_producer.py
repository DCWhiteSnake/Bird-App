import pika, socketio, sys, os
sys.path.insert(0, '..') 
from models.tweet import tweet
import time
sio = socketio.Client()
import logging
body = "{}"

logging.getLogger("pika").setLevel(logging.WARNING)

@sio.event
def connect():
    print('connection established')

@sio.on('Web-Client-Connected')
def Web_Client_Connected():
    '''When the web client is connected'''
    print('Web Client connected')

@sio.on('broadcast_tweet')
def broadcast_tweet(data):
    """ Receive json fromatted tweet data and then publish to a rabbitMQ queue"""
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
    channel = connection.channel()
    print('message received')
    body = tweet.create_from_json(data)
    receiver_id = body.receiver_id

    #Queue declaration is idempotent, so tweets will be stored chronologically under
    #a queue named user_id
    channel.queue_declare(receiver_id, durable=True)
    channel.basic_publish(exchange='',
                          routing_key = receiver_id,
                          body= str(body), mandatory= True)
    sio.emit('message_stored', {'response': 'Successful'})
    print(f'message: {body.tweet}\nfor:{receiver_id} stored successfully\n')
    # connection.close()

@sio.event
def disconnect():
    print('disconnected from server')

if __name__ == '__main__':
    while True:
        try:
            # sio.settimeout(5)
            sio.connect('http://localhost:5000', wait=True)
            break
        except KeyboardInterrupt:
                    print('Gracefully exiting')
                    time.sleep(0.8)
                    try:
                        sys.exit(0)
                    except SystemExit:
                        os._exit(0)
                    finally:
                        print("Successfully exited")
        except Exception as e:
            sio.disconnect()
            print(e)
            continue