import sys
import pika
import json

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
channel.queue_declare(queue="hello")
mess_dict = {"Value": "sdafowaefi", "Alakowe": "I am a bat"}
message = json.dumps(mess_dict)
channel.basic_publish(exchange='',
                      routing_key='hello',
                      body=message)
print(" [x] Sent %r" % message)