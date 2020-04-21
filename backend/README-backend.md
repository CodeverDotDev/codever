# Backend
Back-end REST API for [www.bookmarks.dev](http://www.bookmarks.dev).
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


