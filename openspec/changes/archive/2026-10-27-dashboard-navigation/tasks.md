## 1. Dashboard landing and section pages

- [x] 1.1 Replace the tabbed dashboard view with the grouped overview and
  descriptions; verify group labels and all seven links in Vitest.
- [x] 1.2 Add authenticated routes for all seven sections and a shared
  section-page host that preserves existing inputs; verify direct route
  selection and section rendering in Vitest.
- [x] 1.3 Show each section's page label beside its dashboard back link and
  verify the visible heading in Vitest.

## 2. Redirects and navigation links

- [x] 2.1 Redirect exact `/my-bookmarks` and `/my-notes` roots to their new
  section URLs; verify nested action routes remain available.
- [x] 2.2 Replace tab-query mapping and update tag-specific dashboard links;
  verify old query URLs show the overview and links navigate to the tags page.

## 3. Regression verification

- [x] 3.1 Update dashboard Cypress coverage to use
  `/dashboard/bookmarks`; verify sorting and filtering still work.
- [x] 3.2 Run focused UI tests, lint, and production build; verify all
  dashboard routes compile and existing section behavior remains intact.
