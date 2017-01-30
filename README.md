Codingpedia bookmarks - Backend REST API
========================================

Backend REST API supporting [https://bookmarks.codingpedia.org](https://bookmarks.codingpedia.org/).

This project is developed with the MEAN stack, featuring [MongoDB](https://docs.mongodb.com/manual/), [ExpressJS](https://expressjs.com/en/api.html), [Angular](https://angular.io/docs/ts/latest/) and [NodeJS](https://nodejs.org/en/docs/). The authentication and authorization
 on the website are taken care of via [Keycloak](http://www.keycloak.org/). As you can imagine is some setup required for development, but it's quite easy and straight forward.

The setup is split in two sections
* the front-end concerning angular/webpack setup
* back-end concerning mongo, keycloak

Here is listed how to setup the back-end part. See [front-end setup](https://github.com/Codingpedia/bookmarks) to complete configuration for local development.

## Getting started

### Dependencies

What you need to run this app:
* `node` and `npm` (Use [NVM](https://github.com/creationix/nvm))
* Ensure you're running Node (`v5.x.x`+) and NPM (`3.x.x`+)

#### MongoDB

Follow the instructions from the [Mongo DB documentation](https://docs.mongodb.com/v3.2/installation/) and install version 3.2 on your local machine.
Connect to the mongo client:

```bash
# change to mongo installation directory
$ cd MONGO_HOME

# run the mongo client
$ ./bin/mongo
```

 and then create the codingpedia-bookmarks database:

```bash
# change to mongo installation directory
> use codingpedia-bookmarks

# verify that is present

> show dbs;
admin                  0.000GB
codingpedia-bookmarks  0.000GB
keycloak               0.001GB
local                  0.000GB
```

#### Keycloak

[Install Keycloak, version 2.5.0.Final](https://keycloak.gitbooks.io/server-installation-and-configuration/content/index.html) and start in the [standalone operating mode](https://keycloak.gitbooks.io/server-installation-and-configuration/content/topics/operating-mode/standalone.html) with a port offset of 300:

### Installation and develop on local machine

```bash
# clone front-end repo
$ git clone https://github.com/Codingpedia/bookmarks-api.git codingpedia-bookmarks-api

# change directory to your app
$ cd codingpedia-bookmarks-api

# install the dependencies with npm
$ npm install

# start the server with nodemon, so that changes in the dynamically reflected
$ DEBUG=codingpedia-bookmarks-api:* nodemon start
```

go to [http://localhost:3000](http://localhost:3000) in your browser. You should see the following message - **API Backend supporting Codingpedia Bookmarks**

# License

[MIT](/LICENSE)
