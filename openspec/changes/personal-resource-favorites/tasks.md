## 1. API favorite state

- [ ] 1.1 Add note favorite IDs to the User model and user-data creation flow;
  verify existing bookmark favorites are preserved and profiles without the new
  field load successfully.
- [ ] 1.2 Add the authenticated personal favorite mutation route with input,
  ownership, and visibility validation; verify success, invalid-input, missing
  resource, private-resource, and user-ID mismatch tests.
- [ ] 1.3 Document the personal favorite mutation contract in OpenAPI; verify
  the documented request, response, and error statuses match the route.

## 2. Deletion cleanup

- [ ] 2.1 Remove favorite references from all user profiles on personal,
  administrative, and bulk bookmark deletion and on note deletion; verify each
  deletion service invokes cleanup for every deleted resource ID.
- [ ] 2.2 Add API tests for single and bulk deletion cleanup; verify favorites
  are removed from multiple users while unrelated favorite IDs remain intact.

## 3. UI favorite controls

- [ ] 3.1 Add bookmark/note favorite state and mutation calls to the user data
  service/store; verify the correct typed ID list updates only after success.
- [ ] 3.2 Add the outlined/filled star toggle to bookmark cards and search
  results, including the guest login prompt; verify state changes after a
  successful response and Like counts remain unchanged.
- [ ] 3.3 Add the outlined/filled star toggle to note cards, search results,
  and detail views, including the guest login prompt; verify state changes
  after a successful response.

## 4. Integration and validation

- [ ] 4.1 Verify bookmark and note searches retain existing ordering when
  results include favorites, and favorite state appears on cards and details.
- [ ] 4.2 Run targeted API unit/integration tests and UI component tests; verify
  authorization, favorite toggles, and deletion cleanup pass.
- [ ] 4.3 Run the UI lint/build checks and API lint/tests; verify no template,
  type, or API contract errors are introduced.
