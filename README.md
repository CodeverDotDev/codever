# Bookmarks.dev-API

Back-end API for the [www.bookmarks.dev](http://www.bookmarks.dev).

This project is developed with the MEAN stack, featuring [MongoDB](https://docs.mongodb.com/manual/), [ExpressJS](https://expressjs.com/en/api.html),
 [Angular](https://angular.io/docs/ts/latest/) and [NodeJS](https://nodejs.org/en/docs/). Authentication and authorization
 is done via [Keycloak](http://www.keycloak.org/):
 
 ![components-graph](docs/graphviz/components-graph.png)
 
> The production setup is can be found here - [components production](https://raw.githubusercontent.com/wiki/CodepediaOrg/bookmarks-api/images/network-diagram.png)
***

## Getting Started 

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.
 See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What you need to run this app:
* `node` and `npm` (we recommend using [NVM](https://github.com/creationix/nvm))
  * Ensure you're running Node at least (`v6.x.x`+) and NPM (`3.x.x`+)
* **Docker** - we recommend using [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Installing (development setup)

A step by step series of examples that tell you how to get a development env running

#### Start MongoDB and Keycloak server

```bash
docker-compose up

OR

docker-compose up -d # if you want it to run in the background
```

#### Create a Keycloak user (2 min)
Follow the screenshots in [Add a Keycloak user](docs/keycloak/add-keycloak-user.md) to create a test user to use.

#### Start API

```bash
nvm use
npm install
npm run debug
```

This will start the API with [nodemon](http://nodemon.io) and will watch for code changes and automatically redeploy. 


### Installation and develop on local machine

> Create an `env.json` file based on the the `env.example.json` example. You don't need to configure the _production_ part.

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

## Deployment

- `env.json` is not commit but needs to be delivered at build time 

# License

[MIT](/LICENSE)



