Export/Import Keycloak Realm with docker-compose
---

## Import
When starting Keycloak initially the users are advise to uncomment 
the import line in [docker-compose.yml](../../docker-compose.yml) file.
```yaml
services:
  keycloak:
    ...
    ports:
      - 8480:8080
    depends_on:
      - postgres
    #command: -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=dir -Dkeycloak.migration.dir=/tmp/keycloak/export-import
    command: -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=dir -Dkeycloak.migration.dir=/tmp/keycloak/export-import -Dkeycloak.migration.strategy=IGNORE_EXISTING
    volumes:
      - ./docker-compose-setup/keycloak-export-import:/tmp/keycloak/export-import/
```

> Once the initial import is done comment this line so that it loads faster


## Export
To export the current realm and user base uncomment the ``export`` line instead and comment
the `import` one

```yaml
services:
  keycloak:
    ...
    ports:
      - 8480:8080
    depends_on:
      - postgres
    command: -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=dir -Dkeycloak.migration.dir=/tmp/keycloak/export-import
    #command: -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=dir -Dkeycloak.migration.dir=/tmp/keycloak/export-import -Dkeycloak.migration.strategy=IGNORE_EXISTING
    volumes:
      - ./docker-compose-setup/keycloak-export-import:/tmp/keycloak/export-import/
```

> Don't forget to comment the line after export

## References

- [Importing realm 8.0.2 (Docker)](https://keycloak.discourse.group/t/importing-realm-8-0-2-docker/1442)