# Proposal

## Why

The Angular UI currently runs Jasmine tests through Karma, with several
separate runner targets and Jasmine-specific test helpers. Replacing this
legacy setup with Vitest modernizes the UI test workflow and consolidates
test execution without changing product behavior.

## What Changes

- Replace the UI's Karma/Jasmine test runner with Vitest.
- Migrate all 47 Angular `*.spec.ts` files to the selected Vitest-compatible
  test APIs while preserving their assertions and coverage.
- Preserve the default test command and the focused test targets used for
  on-push lists, shortcuts, collections, and related suites.
- Update test dependencies, Angular test configuration, and TypeScript test
  configuration; remove unused Karma/Jasmine dependencies and configuration.
- Repair incomplete legacy TestBed setup and stale content assertions exposed
  by running the complete suite under Vitest.

## Capabilities

### New Capabilities

None. This is a test-tooling change and introduces no user-visible behavior.

### Modified Capabilities

None. Existing product behavior and requirements remain unchanged.

## Impact

- **Affected app:** `codever-ui` only.
- **Routes:** No public or personal (authenticated) routes are changed.
- **APIs and Mongoose models:** No impact.
- **Dependencies:** Replace Karma/Jasmine tooling with Vitest and the
  Angular-compatible integration required by the selected runner setup.
- **Tests and configuration:** Update all Angular specs and test targets,
  including the app's test TypeScript configuration, and correct stale test
  fixtures without changing application behavior.
