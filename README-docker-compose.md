## docker images

Docker-compose
https://docs.docker.com/compose/

mongo - image
https://hub.docker.com/_/mongo

keycloak
https://hub.docker.com/r/jboss/keycloak/


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



# docker stop container

```bash
docker stop my_container
```


## Keycloak
not authorized on admin to execute command { listDatabases: 1.0 }

http://localhost:8480/auth/admin


### Connect to mongo
mongo -u bookmarks -p --authenticationDatabase dev-bookmarks
db.changeUserPassword("bookmarks", "secret")

### echo environment variables
#### mongo
docker exec bookmarks-api_mongo bash -c 'echo "$MONGO_INITDB_DATABASE"'

#### nodejs
docker exec  bookmarks-api_node bash -c 'echo "$MONGODB_BOOKMARKS_USERNAME"'

### bash in container

#### node
```
docker exec -it bookmarks-api_node /bin/bash
```

#### keycloak
```
docker exec -it bookmarks-api_keycloak /bin/bash
```

### volumes

```bash
docker volume ls | grep mongo
```

```bash
docker volume rm bookmarks-api_mongo_data
```
