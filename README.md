# ENTRUST compose

This repository contains a docker-compose setup intended for use toward the ENTRUST research project for development purposes locally and deployment to the Tellu R&I research cloud VM in AWS.

##### Note: If you're on Windows, make sure all .sh files use LF end of line sequence and not CRLF!

# Deploy
Use the following command in an appropriate terminal in the root folder of the repository:

1. docker-compose build
2. docker-compose up (Optionally with -d to detach the STDOUT from each container from the terminal)

# Copy repository to research project server
1. Create a tarball of the repository locally (I've done it in Ubuntu by accessing the local repository through the /mnt/c/<path to repo>:
   ```
   tar czf compose-entrust.tar.gz compose-entrust
   ```
2. Push the tarball to the AWS server (requires ssh set up according to https://telludoc.atlassian.net/wiki/spaces/TDO/pages/2675179619/AWS+Server+for+R+I+projects)
   ```
   scp -i ~/.ssh/eratosthenes.pem compose-entrust.tar.gz ubuntu@ec2-3-254-120-13.eu-west-1.compute.amazonaws.com:entrust
   ```


# Architecture

##### © 2024 Tellu AS
