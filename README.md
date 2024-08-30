# ENTRUST compose

This repository contains a docker-compose setup intended for use toward the ENTRUST research project for development purposes locally and deployment to the Tellu R&I research cloud VM in AWS.

##### Note: If you're on Windows, make sure all .sh files use LF end of line sequence and not CRLF!

# Deploy

Use the following command in an appropriate terminal in the root folder of the repository:
You might need to run with "sudo" prefix.

1. docker-compose build
2. docker-compose up -d

# Copy repository to research project server (not possible to pull directly from github as-is)

1. Create a tarball of the repository locally (I've done it in Ubuntu by accessing the local repository through the /mnt/c/<path to repo>:
   ```
   tar czf compose-entrust.tar.gz compose-entrust
   ```
2. Push the tarball to the AWS server (requires ssh set up according to https://telludoc.atlassian.net/wiki/spaces/TDO/pages/2675179619/AWS+Server+for+R+I+projects)
   ```
   scp -i ~/.ssh/eratosthenes.pem compose-entrust.tar.gz ubuntu@ec2-3-254-120-13.eu-west-1.compute.amazonaws.com:entrust
   ```
3. SSH into the remote server
   ```
   ssh -i ~/.ssh/eratosthenes.pem ubuntu@ec2-3-254-120-13.eu-west-1.compute.amazonaws.com
   ```
4. Extract the tarball

   ```
   cd entrust
   tar xzf compose-entrust.tar.gz
   ```

5. Build docker image (with sudo)
   sudo docker-compose build

6. Deploy
   sudo docker-compose up -d

# Architecture

# Deploying on localhost

1. Navigate to onboarding-server directory

```
cd onboarding server
```

2. Install dependencies

```
npm install
```

3. Execute npm build-and-start command

```
npm run build-and-start
```

# Workflow

## 1. Register (preDeploy)

```
http://localhost:3010/register?macAddress=user2
```

Registers a new user in the sqlite database (generating new secret)

## 2. Set up to pair

```
http://localhost:3010/Claim?macAddress=user2
```

Changes the entry claimRequested to True in the database (pairing mode)

## 3. Get Credentials

```
http://localhost:3010/getCredentials?macAddress=user2
```

Registers new user in the RabbbitMQ database.

## 4. Unclaim

```

```

Unclaim a device and deletes it from the RabbitMQ database

##### © 2024 Tellu AS
