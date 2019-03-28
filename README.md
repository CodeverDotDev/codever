# API for www.bookmarks.dev, the Bookmark Manager for Developers & Co

This repo contains the back-end API source code of the [www.bookmarks.dev](http://www.bookmarks.dev) website.
 
![Bookmarks Context](docs/bookmarks-dev-context.png)

This project is developed with the MEAN stack, featuring [MongoDB](https://docs.mongodb.com/manual/), [ExpressJS](https://expressjs.com/en/api.html),
 [Angular](https://angular.io/docs/ts/latest/) and [NodeJS](https://nodejs.org/en/docs/). Authentication and authorization
 is done via [Keycloak](http://www.keycloak.org/): 
 
![Network Diagram](https://raw.githubusercontent.com/wiki/Codingpedia/bookmarks-api/images/network-diagram.png)

***


## Development setup

You need mongodb, keycloak and nodejs to get the api working

### Prerequisites

What you need to run this app:
* `node` and `npm` (we recommend using [NVM](https://github.com/creationix/nvm))
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

This is the **heaviest** step, we need to set up for development. But by using Keycloak we get lots of things like Single-Sign On, 
OpenId-Connect Support, social logins, user admin console, that otherwise would take lots of effort to implement by ourselves.
To make our life easier, I have prepared a wiki page about [Keycloak Setup For Development](https://github.com/Codingpedia/bookmarks-api/wiki/Keycloak-Setup-for-Development).

### Installation and develop on local machine

```bash
# clone backend repo
$ git clone https://github.com/Codingpedia/bookmarks-api.git

# change directory to the app
$ cd bookmarks-api

# use the preconfigured node version
$ nvm use

# install the dependencies with npm
$ npm install

# start the server with nodemon, so that changes in the dynamically reflected
$ DEBUG=bookmarks-api:* nodemon start

```

### Testing

Run the integration test by issuing the following command.

```bash
$ npm run integration-tests
```

> For the tests to run the development environment has to be set up


### Swagger docs

* [local](http://localhost:3000/api/docs)
* [production](https://www.bookmarks.dev/api/docs)

## Note

- `env.json` is not commit but needs to be delivered at build time 

# License

[MIT](/LICENSE)



