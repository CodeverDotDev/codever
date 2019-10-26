# Bookmarks.dev-API

Back-end API for the [www.bookmarks.dev](http://www.bookmarks.dev).

## Built With
* [MongoDB](https://docs.mongodb.com/manual/)
* [ExpressJS](https://expressjs.com/en/api.html)
* [Angular](https://angular.io/docs/ts/latest/)
* [NodeJS](https://nodejs.org/en/docs/)
* [Keycloak](http://www.keycloak.org/) for authentication and authorization:
 
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

## Contributing  
Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details



