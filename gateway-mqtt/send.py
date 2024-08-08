import paho.mqtt.client as mqtt
import time

# Define the MQTT broker address and port
broker_address = "mqtt"  #IP address of remote server
broker_port = 1883       # MQTT port
username = "CMD1"       # Username for authentication
password = "user1"       # Password for authentication
topic = "gateway"
message = "This is a message from CMD1. Authorized"

# Create a new MQTT client instance
client = mqtt.Client()

# Set username and password
client.username_pw_set(username, password)

# Connect to the broker
client.connect(broker_address, broker_port, 60)

time.sleep(5)

# Publish a message to the specified topic
client.publish(topic, message)

time.sleep(20)
# # Disconnect from the broker
client.disconnect()
print(f"Message '{message}' published to topic '{topic}'")