import paho.mqtt.client as mqtt
import os
import time

# Wait before starting connection (optional, to ensure RabbitMQ is ready)
time.sleep(15)

# MQTT connection details
MQTT_BROKER = os.getenv('MQTT_BROKER', 'rabbitmq')
MQTT_PORT = int(os.getenv('MQTT_PORT', '1883'))  # RabbitMQ MQTT plugin typically uses port 1883
MQTT_USER = os.getenv('MQTT_USER', 'user1')
MQTT_PASS = os.getenv('MQTT_PASS', 'user1')

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("test/topic")

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print(f"{msg.topic} {msg.payload}")

client = mqtt.Client()
client.username_pw_set(MQTT_USER, MQTT_PASS)

client.on_connect = on_connect
client.on_message = on_message

client.connect(MQTT_BROKER, MQTT_PORT, 60)

# Publish a message to test the connection
client.publish("test/topic", "Hello from MQTT client!")

# Blocking loop to the process network traffic, dispatches callbacks and handles reconnecting.
client.loop_forever()
