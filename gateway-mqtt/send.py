# Define connection parameters
# connection_params = pika.ConnectionParameters(
#     host='mqtt',  # Use the service name defined in Docker Compose
#     port=5672,
#     credentials=pika.PlainCredentials('lapin', 'lapin')
# )

import paho.mqtt.client as mqtt
import time

# Define the MQTT broker address and port
broker_address = "mqtt"  # Use the service name defined in Docker Compose
broker_port = 1883       # Default MQTT port
username = "lapin"       # Username for authentication
password = "lapin"       # Password for authentication
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