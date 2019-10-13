Docker-compose
https://docs.docker.com/compose/

mongo - image
https://hub.docker.com/_/mongo

Initializing a fresh instance
When a container is started for the first time it will execute files with extensions .sh and .js
 that are found in /docker-entrypoint-initdb.d. Files will be executed in alphabetical order. 
 .js files will be executed by mongo using the database specified by the MONGO_INITDB_DATABASE variable, if it is present,
  or test otherwise. You may also switch databases within the .js script.

nodejs - docker image
https://hub.docker.com/_/node/

As we can see, the command defined in in the docker-compose.yml file overrides the one defined in the Dockerfile.
// Command instruction in the Dockerfile
CMD [“node”, “server.js”]
// Command instruction in the docker-compose.yml file
command: nodemon server.js

