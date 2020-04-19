# Bookmarks.dev-API

Back-end REST API for [www.bookmarks.dev](http://www.bookmarks.dev).

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
* [nodemon](https://nodemon.io/) - `npm install -g nodemon`
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
To test with the front-end [bookmarks.dev](https://github.com/CodepediaOrg/bookmarks.dev) create a Keycloak test user.
Follow the screenshots in [Add a Keycloak user](docs/keycloak/add-keycloak-user.md) to create it.

#### Start the development server (API)

```bash
nvm use
npm install
npm run debug
```

This will start the API with [nodemon](http://nodemon.io) and will watch for code changes and automatically redeploy. 

> To be able to automatically add youtube videos published date and duration to the title you need to 
create a _nodemon.json_ file based on the [nodemon.json.example](nodemon.json.example) and a real youtube api key

#### Debugging

##### IntelliJ / Wegstorm (Node.js plugin is required)
The ``npm run debug`` starts nodemon with the `--inspect` parameter so you can attach to this process, by using the following configuration:
![nodejs-remote-debugging](docs/debugging/attach-to-nodemon-process.png)


##### Visual Studio Code
See [Node.js debugging in VS Code with Nodemon](https://github.com/microsoft/vscode-recipes/tree/master/nodemon)


#### Get Keycloak access token via API call
To get a keycloak access token via API call see [Get Access Token from Keycloak via API call](docs/keycloak/get-access-token.md)

## Testing

### Integration tests

> Start Keycloak and mongodb by issuing the `docker-compose up` command

Run the integration test by issuing the following command.

```bash
npm run integration-tests
```

A report will be generated.

## OpenAPI Docs

The API has an OpenAPI specification available at [docs/openapi/openapi.yaml](docs/openapi/openapi.yaml)

Based on that a GUI is generated to test the API directly from browser: 
* [local](http://localhost:3000/api/docs)
* [production](https://www.bookmarks.dev/api/docs)

## Deployment

We currently use [pm2](https://pm2.keymetrics.io/) to start the project in production.

### Start
```bash
pm2 start pm2-process.json --env production
```

> Commited is a [pm2-process.exammple.json](pm2-process.exammple.json) example file

### Restart
```bash
pm2 restart pm2-process.json --env production
```

### Stop
```bash
pm2 stop pm2-process.json --env production
```

## Contributing  
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/CodepediaOrg/bookmarks.dev-api/tags).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details



## Appendix



