## Backup - DONE
- Mongo 

## Set `displayName`

## Keycloak setup - DONE

### Add **KEYCLOAK_REALM_ADMIN** role to realm - DONE
You will need this role to execute the following API calls

### Create service account to get KEYCLOAK_REALM_ADMIN role - DONE
Client - `keycloak-realm-admin-service-account`

### Set display name for `user` via admin api call - DONE
Get Access Token and Call admin api
```
PUT https://www.bookmarks.dev/api/admin/users/profile/display-name
```

### Set displayName for bookmarks - DONE
1583991554828_add-user-display-name-in-bookmarks.js

## Set `imageUrl` - DONE

Get Access Token and Call admin api
```
PUT https://www.bookmarks.dev/api/admin/users/profile/image-url
```

### set AWS env variables in pm2 for prod - DONE


### Clone bookmarks found in favorites to users personal - DONE
Execute script - 1585427412659_change-favorites-to-copy-to-mine.js

## Testing
New user, then delete with service account
