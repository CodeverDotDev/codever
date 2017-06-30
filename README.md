# Codingpedia bookmarks, aka #codingmarks

This repo contains the back-end source code of the [codingmarks.org](http://codingmarks.org) website - (cu)rated bookmarks for developers.
 
![Codingmarks Context](https://raw.githubusercontent.com/wiki/Codingpedia/bookmarks-api/images/codingmarks-context.png)

This project is developed with the MEAN stack, featuring [MongoDB](https://docs.mongodb.com/manual/), [ExpressJS](https://expressjs.com/en/api.html),
 [Angular](https://angular.io/docs/ts/latest/) and [NodeJS](https://nodejs.org/en/docs/). Authentication and authorization
 is done via [Keycloak](http://www.keycloak.org/): 
 
![Network Diagram](https://raw.githubusercontent.com/wiki/Codingpedia/bookmarks-api/images/network-diagram.png)

***

# Development setup

There is a **two-step** setup required for development 
* **[front-end setup](https://github.com/Codingpedia/bookmarks)** concerning angular/angular-cli setup; this is described on this page
* **backend-end setup** concerning mongodb, keycloak, nodejs

> You need to complete both parts for local development

## Back-end

### Prerequisites

What you need to run this app:
* `node` and `npm` (I recommend to use [NVM](https://github.com/creationix/nvm))
* Ensure you're running Node at least (`v6.x.x`+) and NPM (`3.x.x`+)

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

This is the "heaviest" step, we need to set up for development. But by using Keycloak we get lots of things like Single-Sign On, 
OpenId-Connect Support, social logins, user admin console, that otherwise would take lots of effort to implement by ourselves.
To make our life easier, I have prepared a wiki page about [Keycloak Setup For Development](https://github.com/Codingpedia/bookmarks-api/wiki/Keycloak-Setup-for-Development).

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
