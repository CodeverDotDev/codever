# Resource sharing deployment

Sharing links are bearer credentials. Anyone with an active link can read the
current bookmark or note content, including copyable fields and notebook
source. Tokens are stored in plaintext for this release. Restrict database
and backup access accordingly.

## Before deployment

1. Back up the database and deploy the `ShareLink` indexes before enabling
   link creation. The Mongoose collection name is `sharelinks`.
2. Run the share-link index migration from the repository root:

   ```bash
   docker exec -i codever-mongo \
     mongosh --quiet \
     --username mongoadmin \
     --password "$MONGO_ADMIN_PASSWORD" \
     --authenticationDatabase admin \
     "$MONGODB_DB" \
     < apps/codever-api/resources/db-migration/mongodb/\
   1792852306000_create-sharelinks-indexes.js
   ```

   The migration is idempotent and creates the `sharelinks` collection when
   needed. It does not modify bookmark or note documents. For local Docker,
   use `--password secret` and `dev-bookmarks`.

3. Deploy the API, Angular application, and nginx configuration together.
   Drain old API instances before switching traffic. Old resolvers must not
   remain available beside the new resolver.
4. Publish the Angular service-worker update. Its API data group has a new
   name and version, and no longer matches bookmark/note content or personal
   routes. Confirm installed clients activate the update.
5. Tell users that old sharing URLs will stop working and must be explicitly
   recreated. Existing resource documents are not migrated or rewritten.

## Release checks

- Create a bookmark and note link as the owner. Repeating create/status must
  return the same active token without generating a new link.
- Confirm the dashboard list contains current titles and no token field.
- Read a private resource through its new link, then revoke it and confirm
  the same URL returns 404 with `Cache-Control: no-store`.
- Confirm a public resource remains available through its ordinary public
  URL after its separate share link is revoked.
- Confirm malformed, old, wrong-type, and revoked tokens return the same
  sanitized 404 response.
- Check API and nginx access logs with a test token in both the request path
  and Referer. Neither log should contain the token.
- Confirm shared API and page responses use `Referrer-Policy: no-referrer`.

Use the API contract documented in
[`openapi/openapi.yaml`](../apps/codever-api/docs/openapi/openapi.yaml).
The owner endpoints return credentials only from authenticated status/create
calls; the shared list does not contain them.

## Rollback

Do not restore the legacy `shareableId` resolver or create-on-GET routes:
that would make old credentials usable again. If rollback is necessary,
disable both owner link creation and anonymous shared resolution at the API
boundary, retain the fail-closed public routes, and only re-enable sharing
after a compatible resolver and proxy configuration are restored.

Previously copied content cannot be recalled. Revocation denies subsequent
requests; it does not erase recipient copies or terminate an already-open
response. Encryption, expirations, access history, and dedicated rate limits
are outside this release.
