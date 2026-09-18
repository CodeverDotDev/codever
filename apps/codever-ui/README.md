# Frontend

The User Interface (frontend) is built with [Angular](https://angular.io/) and [Angular CLI](https://cli.angular.io/)

---

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

### OnPush list regression tests

From `apps/codever-ui`, run `npm run test:onpush`.

This isolated Karma target uses ChromeHeadless and mocked services; no API,
Keycloak or Docker is needed. Chrome must be installed (set `CHROME_BIN` if it
is not in the default location). It does not depend on the legacy test target's
missing `src/test.ts` or `karma.conf.js` files.

`AsyncBookmarkListComponent`, `BookmarkListElementComponent`, and
`AsyncNoteListComponent` use `OnPush`. Keep `provideZoneChangeDetection()` in
bootstrap: this is not a zoneless migration. `NoteDetailsComponent` retains
Default detection; its list ancestor skips the subtree during unrelated checks.
Pagination and note clipboard callbacks notify their OnPush list ancestors.

Tests use real templates to cover skipped checks, list updates, filtering, user
state, clipboard feedback, pagination, note checklist rollback, zoom and the
standalone TOC. They verify skipped work, not a measured percentage speedup.
Compare representative large lists in Angular DevTools to measure the benefit.

### Running end-to-end tests

Before running the tests make sure you are serving the app via `ng serve`.

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Deployment

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

I use an alias for that

```shell
alias codever-build-aot='cd ~/projects/dev/personal/codever/codever/frontend; rm -rf dist*; nvm use; npm run build:aot'
```
