# Backend
Back-end REST API for [www.bookmarks.dev](http://www.bookmarks.dev).

## Development
This section concerns about the local developemnt

### Troubleshooting

#### Restart backend
It might happen to have a zombie running nodejs running on the port `3000` when trying to run `npm run debug`.
Kill the process and try again

```shell
lsof -i tcp:3000
kill -9 xxx # where xxx is the process number from the command above
npm run debug # restart the backend server as usual
```

## OpenAPI Docs
The API has an OpenAPI specification available at [docs/openapi/openapi.yaml](docs/openapi/openapi.yaml)

Based on that a GUI is generated to test the API directly from browser:
* [local](http://localhost:3000/api/docs)
* [production](https://www.bookmarks.dev/api/docs)

## Deployment
We currently use [pm2](https://pm2.keymetrics.io/) to start the project in production.

Undo local changes if needed:
```
git fetch
git reset --hard origin/master
```

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


## Troubleshooting

### pm2 start errored
When `pm2 start pm2 start pm2-process.json --env production` has the status `errored`, it might help to delete the app id
 `pm2 delete bookmarks.dev-api-node-10.15.0` and then try again

