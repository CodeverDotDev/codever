
# Codingpedia bookmarks

(Cu)rated bookmarks for developers. Visit [https://bookmarks.codingpedia.org](https://bookmarks.codingpedia.org/) to look through the public bookmarks and create your own list.

This project is developed with the MEAN stack, featuring [MongoDB](https://docs.mongodb.com/manual/), [ExpressJS](https://expressjs.com/en/api.html), [Angular](https://angular.io/docs/ts/latest/) and [NodeJS](https://nodejs.org/en/docs/). The authentication and authorization
 on the website are taken care of via [Keycloak](http://www.keycloak.org/). As you can imagine is some setup required for development, but it's quite easy and straight forward.

The setup is split in two sections
* the front-end concerning angular/webpack setup
* back-end concerning mongo, keycloak

Here is listed how to setup the front-end part. See [backend-end setup](https://github.com/Codingpedia/bookmarks-api) to complete configuration for local development.

## Getting started

The front-end is built with Angular and used the [preboot/angular2-webpack](https://github.com/preboot/angular2-webpack) seed project.

### Dependencies

What you need to run this app:
* `node` and `npm` (Use [NVM](https://github.com/creationix/nvm))
* Ensure you're running Node (`v5.x.x`+) and NPM (`3.x.x`+)

### Installation and develop on local machine

```bash
# clone front-end repo
$ git clone https://github.com/Codingpedia/bookmarks.git codingpedia-bookmarks

# change directory to your app
$ cd codingpedia-bookmarks

# install the dependencies with npm
$ npm install

# start the server
$ npm start
```
go to [http://localhost:8080](http://localhost:8080) in your browser.

### Testing

### 1. Unit Tests

* single run: `npm test`
* live mode (TDD style): `npm run test-watch`

#### 2. End-to-End Tests (aka. e2e, integration)

* single run:
  * in a tab, *if not already running!*: `npm start`
  * in a new tab: `npm run webdriver-start`
  * in another new tab: `npm run e2e`
* interactive mode:
  * instead of the last command above, you can run: `npm run e2e-live`
  * when debugging or first writing test suites, you may find it helpful to try out Protractor commands without starting up the entire test suite. You can do this with the element explorer.
  * you can learn more about [Protractor Interactive Mode here](https://github.com/angular/protractor/blob/master/docs/debugging.md#testing-out-protractor-interactively)

### Production

To build the application, run:

* `npm run build`

You can now go to `/dist` and deploy that to the server!

### Documentation

Api docs (using [TypeDoc](http://typedoc.org/)) for the code with the following:

* `npm run docs`

# License

[MIT](/LICENSE)
