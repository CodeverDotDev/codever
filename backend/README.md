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

#### Start the development server (API)

```bash
nvm use
npm install
npm run debug
```

#### Debugging

##### IntelliJ / Webstorm (Node.js plugin is required)
The ``npm run debug`` starts nodemon with the `--inspect` parameter so you can attach to this process, by using the following configuration:
![nodejs-remote-debugging](docs/debugging/attach-to-nodemon-process.png)


##### Visual Studio Code
See [Node.js debugging in VS Code with Nodemon](https://github.com/microsoft/vscode-recipes/tree/master/nodemon)


#### Get Keycloak access token via API call
To get a keycloak access token via API call see [Get Access Token from Keycloak via API call](../documentation/keycloak/get-access-token.md)

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



## Appendix



