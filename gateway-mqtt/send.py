import paho.mqtt.client as mqtt
import time

# Define the MQTT broker address and port
broker_address = "3.254.120.13"  #IP address of remote server
broker_port = 1885       # MQTT port
username = "admin"       # Username for authentication
password = "admin"       # Password for authentication
topic = "gateway"
message = "Hello, World!"


# Create a new MQTT client instance
client = mqtt.Client()

# Set username and password
client.username_pw_set(username, password)

# Connect to the broker
client.connect(broker_address, broker_port, 60)

# Publish a message to the specified topic
client.publish(topic, message)

time.sleep(30)

# Disconnect from the broker
client.disconnect()

print(f"Message '{message}' published to topic '{topic}'")