# Tasks

## 1. Configure the Vitest runner

- [x] 1.1 Replace Karma test builders with Angular's Vitest unit-test
  builder, add a test-only Zone.js build configuration, and preserve
  existing test target selections; verify the Angular CLI recognizes the
  targets.
- [x] 1.2 Add Vitest dependencies and update test TypeScript configurations;
  verify dependency installation completes without peer-dependency errors.

## 2. Migrate Jasmine-based specs

- [x] 2.1 Convert Jasmine spy and clock APIs in shortcut and app shortcut
  specs to Vitest APIs; verify the shortcut-focused targets pass.
- [x] 2.2 Convert Jasmine APIs in on-push lists, copyable fields, and tag
  editor specs; verify the on-push and copyable-focused targets pass.
- [x] 2.3 Migrate the remaining Angular specs to explicit Vitest imports
  and compatible async/test utilities; verify collection-focused targets
  pass.
- [x] 2.4 Repair incomplete legacy TestBed providers and stale content
  assertions exposed by the full-suite run; verify the complete UI suite
  passes.

## 3. Remove obsolete runner setup and validate

- [x] 3.1 Remove unused Karma configuration and Jasmine/Karma dependencies;
  verify no active Angular test target references the old runner.
- [x] 3.2 Run the complete UI test suite without watch mode, lint the UI,
  and build the UI; verify all commands complete successfully.
