## Purpose

Defines the styling and interaction baseline the Codever web UI delivers to browsers: which Bootstrap line is shipped, the single self-hosted source that serves it, the interactive components that must keep working without jQuery or external scripts, and the responsive, accessibility, and behavior guarantees that must survive the upgrade.

## ADDED Requirements

### Requirement: UI ships the current supported Bootstrap line

The UI SHALL serve its page styling from the Bootstrap 5.3.x line and SHALL NOT serve any Bootstrap 4 stylesheet.

#### Scenario: Page styling comes from the Bootstrap 5 baseline

- **WHEN** any UI route is loaded in a browser
- **THEN** the styling applied to the page originates from the Bootstrap 5.3.x line
- **AND** no Bootstrap 4 stylesheet is loaded

### Requirement: Page styling is served from the application's own build output

The UI SHALL load exactly one Bootstrap stylesheet, and SHALL serve it from the application's own origin as part of the built application rather than from a third-party content delivery network.

#### Scenario: Single self-hosted stylesheet

- **WHEN** any UI route is loaded in a browser
- **THEN** exactly one Bootstrap stylesheet is fetched
- **AND** that stylesheet resolves to the application's own origin

#### Scenario: No third-party style host is contacted

- **WHEN** any UI route is loaded in a browser
- **THEN** no request is made to a third-party host for Bootstrap styles

### Requirement: Interactive components work without jQuery or external scripts

Markup-driven interactive components SHALL keep working while the page loads no jQuery runtime and no third-party script from an external host. In scope: dropdown menus, the collapsible navigation toggle, and modal dismissal.

#### Scenario: Dropdown menu opens

- **WHEN** a user activates a dropdown trigger in any UI area that offers one
- **THEN** the associated menu is revealed
- **AND** jQuery is not present on the page

#### Scenario: Collapsible navigation toggles

- **WHEN** a user activates the navigation toggle at a narrow viewport
- **THEN** the navigation items are revealed
- **AND** activating the toggle again hides them

#### Scenario: Modal dismissal

- **WHEN** a user activates the dismiss control on the error modal
- **THEN** the modal is closed

#### Scenario: No external script host is contacted

- **WHEN** any UI route is loaded in a browser
- **THEN** no jQuery, Popper, or Bootstrap script is requested from an external host

### Requirement: Existing class contracts keep rendering as before

Elements the UI styles today by composing its own stylesheets with Bootstrap SHALL keep their intended rendered appearance after the upgrade. In scope: spacing and alignment utilities, badges and their semantic colors, floated elements, screen-reader-only text, form controls, and the hero block.

#### Scenario: Spacing and alignment utilities still apply

- **WHEN** a view that relied on directional spacing or float utilities under Bootstrap 4 is rendered
- **THEN** the element keeps its intended margin, padding, and alignment

#### Scenario: Semantic badges keep their color

- **WHEN** a badge expressing a semantic state such as success or secondary is rendered
- **THEN** the badge displays that semantic color with the same legible text contrast as before
- **AND** a pill-shaped badge is still rounded

#### Scenario: Form controls keep their styling

- **WHEN** a form containing select, checkbox, radio, file, or range inputs is rendered
- **THEN** those controls keep their intended styled appearance

### Requirement: Accessibility affordances are preserved

The upgrade SHALL preserve screen-reader-only text, visible keyboard focus indication, and usable touch target sizes.

#### Scenario: Screen-reader-only text stays hidden visually but available

- **WHEN** a view containing screen-reader-only text is rendered
- **THEN** that text is not visible on screen
- **AND** it remains available to assistive technology

#### Scenario: Keyboard focus stays visible

- **WHEN** a user navigates the UI with the keyboard
- **THEN** the focused control shows a visible focus indication

### Requirement: Responsive layout and breakpoints are preserved

The upgrade SHALL NOT change the UI's responsive behavior, including the custom container widths the UI applies at the 1000px and 1600px breakpoints and the existing transitions around 680px, 768px, 1200px, and 1349px.

#### Scenario: Desktop, tablet, and mobile layouts are unchanged

- **WHEN** a representative UI route is rendered at desktop, tablet, and mobile widths
- **THEN** the layout, element positions, and navigation behavior match the pre-upgrade rendering

#### Scenario: Custom container widths still apply

- **WHEN** the viewport is at least 1000px wide
- **THEN** the main container is constrained to the custom width the UI defines for that range

### Requirement: Client and API behavior are unchanged

The upgrade SHALL NOT alter routing, authentication, data fetching, or any API request or response shape.

#### Scenario: UI routes and data flows behave as before

- **WHEN** a user navigates the UI and performs bookmark, note, and collection operations
- **THEN** route resolution, API requests, and API responses are unchanged from the pre-upgrade behavior
