import requests
from requests.auth import HTTPBasicAuth
import os
import time

# Step 1: Create a user
# Environment variables
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'guest')
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq')
RABBITMQ_PORT = os.getenv('RABBITMQ_PORT', '15672')

# URL for the RabbitMQ management API
url = f'http://{RABBITMQ_HOST}:{RABBITMQ_PORT}/api/users'

# New user data
new_user = {
    "password": "user1",
    "tags": ""
}

time.sleep(10)

# Adding a new user via RabbitMQ HTTP API
response = requests.put(
    f"{url}/user1",
    json=new_user,
    auth=HTTPBasicAuth(RABBITMQ_USER, RABBITMQ_PASS)
)

if response.status_code == 201:
    print("User created successfully!")
else:
    print(f"Failed to create user: {response.status_code} - {response.text}")

# Step II: Set-up the permisions
admin_user = 'guest'
admin_password = 'guest'
mqtt_user = 'user1'
vhost = '%2F'

url = f"http://{RABBITMQ_HOST}:{RABBITMQ_PORT}/api/permissions/{vhost}/{mqtt_user}"
permissions = {
    "configure": ".*",
    "write": ".*",
    "read": ".*"
}

response = requests.put(url, json=permissions, auth=HTTPBasicAuth(admin_user, admin_password))
if response.status_code == 201:
    print("Permissions set successfully!")
else:
    print(f"Failed to set permissions: {response.status_code} - {response.text}")