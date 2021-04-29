# Frontend
 The User Interface (frontend) is built with [Angular](https://angular.io/) and [Angular CLI](https://cli.angular.io/)

***

# Getting Started 

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.
 See deployment for notes on how to deploy the project on a live system.
 
## Development setup

This project was generated with [Angular CLI](https://github.com/angular/angular-cli)

> Change to the `frontend` folder before running any of the commands bellow - `cd frontend`

### Development server

Run `ng serve` for a dev server. Navigate to [`http://localhost:4200/`](http://localhost:4200). The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

## Testing

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Deployment

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

I use an alias for that
```shell
alias bookmarks-build-aot='cd ~/projects/dev/personal/bookmarks/bookmarks.dev/frontend; rm -rf dist*; nvm use; npm run build:aot'
```

