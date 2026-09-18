# Codever Keycloak theme

This directory contains the custom [Keycloak](https://www.keycloak.org/) theme used by Codever for local development.
It adds Codever branding to the Keycloak login page, Account Console, and email messages.

The theme is designed for the Keycloak version used by the repository's Docker Compose setup (`quay.io/keycloak/keycloak:24.0`).
It is mounted into the running Keycloak container rather than built into a separate JAR or Docker image.

## Theme contents

The theme is located in `codever/`:

| Theme area | Purpose |
| --- | --- |
| [`login/theme.properties`](codever/login/theme.properties) | Codever logo, favicon, and login-page styling. It extends Keycloak's built-in `keycloak` theme. |
| [`account/theme.properties`](codever/account/theme.properties) | Codever branding for the Keycloak 24 Account Console v2. It extends `keycloak.v2` and uses the Codever logo. |
| [`email/theme.properties`](codever/email/theme.properties) | Codever email subjects and HTML bodies for verification, password reset, and account actions. |

The `theme.properties` files define the parent theme and the resources that are overridden.
In particular, the Account Console uses Keycloak's React-based `keycloak.v2` theme;
it is not the deprecated FreeMarker-based Account Console theme.

## Local development

### Prerequisites

- Docker Desktop with Docker Compose
- A checked-out copy of the Codever repository

The repository's `docker-compose.yml` mounts this directory into the Keycloak container:

```yaml
./apps/codever-keycloak-theme/codever/:/opt/keycloak/themes/codever/
```

No separate theme build step is required.

### Start Keycloak

From the repository root, start the development services:

```bash
docker compose up
```

The local Keycloak server is available at:

- Base URL: <http://localhost:8480/auth>
- Admin Console: <http://localhost:8480/auth/admin>
- Admin username: `admin`
- Admin password: `Pa55w0rd`
- Codever realm: `bookmarks`

The credentials above are development credentials defined in `docker-compose.yml`. Never reuse them in a shared or production environment.

### First-time realm setup

The Compose configuration imports the development realm from `docker-compose-setup/keycloak-export-import/`.
On a fresh setup, follow the repository's Docker instructions for enabling the realm import.
After the realm has been imported, select the `bookmarks` realm in the Admin Console.

## Activate the theme

Open the [Codever theme settings](http://localhost:8480/auth/admin/master/console/#/realms/bookmarks/theme-settings)
and choose `codever` for the theme areas you want to customize:

- **Login theme:** `codever`
- **Account theme:** `codever`
- **Email theme:** `codever`

Save the realm settings after changing them. The Account Console can be checked at:

- [Currently logged-in account](http://localhost:8480/auth/realms/bookmarks/account/)

The Account Console requires a logged-in user. Use the local development user configured for your realm
or create one through the [Keycloak Admin Console](../../documentation/keycloak/add-keycloak-user.md).

## Making changes

1. Edit the relevant file below `codever/`.
2. Restart the Keycloak container if the change is not picked up automatically:

   ```bash
   docker compose restart keycloak
   ```

3. Refresh the browser. Keycloak and the browser may cache theme resources,
so use a hard refresh or an incognito window when testing CSS, images, or email templates.

Useful locations include:

- Login CSS: [`codever/login/resources/css/logo.css`](codever/login/resources/css/logo.css)
- Login images: `codever/login/resources/img/` (for example, [`codever-keycloak.logo-199x46.png`](codever/login/resources/img/codever-keycloak.logo-199x46.png))
- Login configuration: [`codever/login/theme.properties`](codever/login/theme.properties)
- Account logo: [`codever/account/resources/logo.png`](codever/account/resources/logo.png)
- Account messages: [`codever/account/messages/messages_en.properties`](codever/account/messages/messages_en.properties)
- Email templates: `codever/email/html/` (for example, [`email-verification.ftl`](codever/email/html/email-verification.ftl))
- Email messages: [`codever/email/messages/messages_en.properties`](codever/email/messages/messages_en.properties)

When adding a login resource, make sure it is referenced by the corresponding `theme.properties` file.
The Account Console logo is resolved relative to the Account theme's `resources/` directory,
so `logo=/logo.png` refers to `codever/account/resources/logo.png`.

## Testing email templates

Email templates are only visible when Keycloak can send mail. Configure the SMTP settings in the `bookmarks` realm
under **Realm settings > Email**, then trigger an action such as email verification or password reset.
The HTML templates use Keycloak's standard placeholder variables; preserve those placeholders when editing the text.

## Troubleshooting

### The `codever` theme is not listed

Check that the Keycloak container was started from the repository root and that the bind mount is present:

```bash
docker compose config
docker compose exec keycloak ls -la /opt/keycloak/themes/codever
```

If necessary, recreate the container:

```bash
docker compose up -d --force-recreate keycloak
```

### Changes are not visible

- Confirm that the edited file exists inside `/opt/keycloak/themes/codever`.
- Restart Keycloak with `docker compose restart keycloak`.
- Hard-refresh the page or use a private browser window.
- Check that the correct realm is selected and that the relevant theme area is set to `codever`.

### The Account Console is not branded

Keycloak 24 uses the Account Console v2 theme. Confirm that `codever/account/theme.properties` contains `parent=keycloak.v2` and that the realm's **Account theme** is set to `codever`. The old Account Console v1 CSS overrides do not apply to the React-based console.

## Production considerations

This theme is currently intended for local development. Before using it in a deployed Keycloak environment:

- Pin and verify the Keycloak version because theme parent names and templates can change between Keycloak releases.
- Package or mount the theme through the deployment's normal Keycloak image process.
- Replace all development credentials and URLs.
- Test login, logout, account management, email verification, password reset, and error pages.
- Keep customizations small and prefer extending the built-in Keycloak theme so upgrades remain manageable.
