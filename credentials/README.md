# Credentials Folder

## The purpose of this folder is to store all credentials needed to log into your server and databases. This is important for many reasons. But the two most important reasons is
    1. Grading , servers and databases will be logged into to check code and functionality of application. Not changes will be unless directed and coordinated with the team.
    2. Help. If a class TA or class CTO needs to help a team with an issue, this folder will help facilitate this giving the TA or CTO all needed info AND instructions for logging into your team's server. 


# Below is a list of items required. Missing items will causes points to be deducted from multiple milestone submissions.

1. Server URL or IP: <b>csc648team3.ddns.net</b>
2. SSH username: <b>ubuntu</b>
3. SSH password or key: <b>sshKey.pem in credentials directory.</b>
4. Database URL or IP and port used: <b>LocalHost only, use ssh tunneling. Default port: 3306.</b>
5. Database username: <b>admin</b>
6. Database password: <b>admin-648T3</b>
7. Database name (basically the name that contains all your tables): <b>csc648t3_production</b>
8. Instructions on how to use the above information.

Download the sshKey.pem file to your system and place somewhere convienent. 
<br>ssh into the server by using <br>'ssh -i  "\<path to sshKey.pem>" ubuntu@csc648team3.ddns.net'. 
<br> Create a ssh tunnel to the database by using 
<br>'ssh -i  "\<path to sshKey.pem>" -N -L 3306:127.0.0.1:3306 ubuntu@csc648team3.ddns.net'. 
<br>Then log into the database as if it was localhost using standard methods: mysql -u admin -p -h 127.0.0.1 or a GUI based program.

# Most important things to Remember
## These values need to kept update to date throughout the semester. <br>
## <strong>Failure to do so will result it points be deducted from milestone submissions.</strong><br>
## You may store the most of the above in this README.md file. DO NOT Store the SSH key or any keys in this README.md file.
