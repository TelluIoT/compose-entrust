import paho.mqtt.client as mqtt
import time

# Define the MQTT broker address and port
broker_address = "localhost"  #IP address of remote server // previously: 3.254.120.13
broker_port = 1883       # MQTT port // previously: 1885
username = "gateway3"       # Username for authentication
password = "1234"       # Password for authentication
topic = "amq.topic/TGW:gateway3"
message = "Hello, World from client 1."

time.sleep(10)

# Create a new MQTT client instance
client = mqtt.Client()

# Set username and password
client.username_pw_set(username, password)

# Connect to the broker
client.connect(broker_address, broker_port, 60)

# Publish a message to the specified topic
result = client.publish(topic, message)
print(f"publish result: {result}")

time.sleep(30)

# Disconnect from the broker
client.disconnect()

print(f"Message '{message}' published to topic '{topic}'")