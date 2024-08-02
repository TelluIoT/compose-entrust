import pika
import time

# Define connection parameters
connection_params = pika.ConnectionParameters(
    host='mqtt',  # Use the service name defined in Docker Compose
    port=5672,
    credentials=pika.PlainCredentials('lapin', 'lapin')
)

# Establish connection
connection = pika.BlockingConnection(connection_params)
print("Connection established: ", connection)

# Open a channel
channel = connection.channel()
print("Channel opened: ", channel)

# Declare a queue
channel.queue_declare(queue='rpm-measurements')



# Send a message
channel.basic_publish(exchange='', routing_key='rpm-measurements', body='Hello, World!')

print(" [x] Sent 'Hello, World!'")

# Close the connection
connection.close()
