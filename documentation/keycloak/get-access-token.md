How to get a keycloak access token via API call
---
Some times you might need to get an access token to call the secured api without having to login in the webapp.

Below are shown some examples of doing that for the dev environment.

## Get Access Token via service user password (grant type `password`)
```bash
curl  -s \
  -d 'client_id=bookmarks' \
  -d 'username=ama' \
  -d "password=ama" \
  -d 'grant_type=password' \
  'http://localhost:8480/auth/realms/bookmarks/protocol/openid-connect/token' \
| jq -r '.access_token'
```

```
curl  -s \
  -d 'client_id=admin-service-account' \
  -d 'username=admin-integration-tests' \
  -d "password=admin-integration-tests" \
  -d 'grant_type=password' \
  'http://localhost:8480/auth/realms/bookmarks/protocol/openid-connect/token' \
| jq -r '.access_token'
```

## Get Access Token via service account (grant type `client_credentials`)
```bash
curl  \
  -d 'client_id=integration-tests-service-account' \
  -d 'client_secret=90f67674-58d1-4928-8a01-256905389464' \
  -d "password=Test1234" \
  -d 'grant_type=client_credentials' \
  'http://localhost:8480/auth/realms/bookmarks/protocol/openid-connect/token' \
| jq -r '.access_token'
```


## Production

### For Keycloak Realm Admin Role

```bash
curl  \
  -d 'client_id=keycloak-realm-admin-service-account' \
  -d 'client_secret=CHANGE-ME' \
  -d 'grant_type=client_credentials' \
  'https://www.bookmarks.dev/auth/realms/bookmarks/protocol/openid-connect/token' \
| jq -r '.access_token'
```
