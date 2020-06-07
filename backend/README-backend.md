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
```shell
pm2 start pm2-process.json --env production
```

> Commited is a [pm2-process.exammple.json](pm2-process.exammple.json) example file

### Restart
```shell
pm2 restart pm2-process.json --env production
```

### Stop
```shell
pm2 stop pm2-process.json --env production
```


## Troubleshooting

### Show pm2 logs
```shell
pm2 logs bookmarks.dev-api-node-10.15.0 --lines 1000
```

### Show morgan logs
```shell
tail -f n100 ~/projects/bookmarks.dev-bk/backend/log/access.log
```

### pm2 start errored
When `pm2 start pm2 start pm2-process.json --env production` has the status `errored`, it might help to delete the app id
 `pm2 delete bookmarks.dev-api-node-10.15.0` and then try again

