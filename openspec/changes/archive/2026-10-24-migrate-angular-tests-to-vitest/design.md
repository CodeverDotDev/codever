# Design

## Context

See `proposal.md` for motivation and scope. The UI uses Angular 22 and
`@angular/build`; its default and focused test targets currently use the
Karma builder, Jasmine, and ChromeHeadless. There are 47 spec files,
eight test-specific TypeScript configurations, and several targets that
select focused test subsets.

## Goals / Non-Goals

**Goals:**

- Use Angular's first-party unit-test builder with Vitest.
- Keep `ng test` and the existing focused npm test commands available.
- Preserve test intent and coverage while removing Jasmine/Karma coupling.
- Run unit tests in jsdom without a separate browser installation.

**Non-Goals:**

- Change application behavior, production build configuration, or Cypress
  end-to-end tests.
- Introduce a custom Vitest integration or a separate browser-testing stack.

## Decisions

### Use Angular's first-party Vitest builder

Replace `@angular/build:karma` targets with
`@angular/build:unit-test` configured for Vitest. This keeps test execution
integrated with Angular CLI and avoids a separate community adapter.

An external Vitest/Angular adapter was considered but is unnecessary for the
current Angular CLI workflow and would add another integration to maintain.

### Configure a test-only build target for Zone.js

The application has no `build:development` configuration, so each unit-test
target must name an explicit build target. Add a test-only build configuration
that includes the existing Reflect polyfills, Zone.js, and
`zone.js/testing` followed by `zone.js/plugins/vitest-patch`. The Vitest
patch is available in Zone.js 0.16.3, which is supported by the project's
Angular version. This keeps existing `fakeAsync` and `waitForAsync` tests
compatible without emitting top-level `await`.

### Use jsdom rather than a real browser

Configure the Vitest test environment for jsdom. The existing ChromeHeadless
runner provides a real browser, but the UI unit tests primarily use Angular
TestBed and DOM APIs; jsdom is the simpler, faster unit-test environment.
Tests that need unsupported browser behavior should mock that boundary.

Vitest browser mode was considered to preserve real Chrome execution. It
would require a browser provider and browser setup in CI, which is not
justified unless migration exposes behavior jsdom cannot represent.

### Keep the focused test targets

Retain the default test target and the named focused targets. Preserve their
`include` patterns and relevant TypeScript configuration so existing npm
commands continue to select the same suites. Remove Karma-only options and
the shared Karma configuration when no longer referenced.

### Migrate Jasmine APIs explicitly

Convert Jasmine-specific spy creation, spy assertions, and clock controls
to Vitest equivalents. Keep Angular TestBed and Angular testing utilities
where compatible; prefer asynchronous test flows for timer or stabilization
cases that do not work reliably with Vitest fake timers.

Use explicit Vitest imports in specs rather than relying on implicit globals.
This makes the test API dependency visible and avoids global type collisions.
Specs using Angular `fakeAsync` or `waitForAsync` must use Vitest's global
test functions so Zone.js can wrap them; their type declarations are scoped
to the test TypeScript configurations.

Repair incomplete TestBed providers and stale page-copy assertions surfaced
by the full-suite run. These changes keep component tests isolated and align
assertions with current UI content; they do not change application behavior.

## Risks / Trade-offs

- [Jasmine spy and clock behavior differs from Vitest] -> Convert the
  affected specs deliberately and run each focused target during migration.
- [jsdom differs from Chrome for browser-specific APIs] -> Mock unsupported
  APIs in unit tests; revisit browser mode only if an existing assertion
  demonstrably requires real browser behavior.
- [Focused targets may drift during configuration changes] -> Keep their
  current file include patterns and verify each existing npm test command.

## Migration Plan

1. Configure Vitest through Angular's unit-test builder and retain each
   target's current test selection.
2. Convert Jasmine-specific APIs and update spec TypeScript types and test
   imports.
3. Run the focused targets, then the complete UI suite, and remove obsolete
   Karma/Jasmine configuration and dependencies.
4. Roll back by restoring the prior test builder, package dependencies,
   Karma configuration, and Jasmine-based specs if the migrated suite
   cannot be made reliable.
