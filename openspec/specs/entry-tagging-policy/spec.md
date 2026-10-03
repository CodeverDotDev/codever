# entry-tagging-policy Specification

## Purpose

Keep note and bookmark tagging consistent across authoring channels while distinguishing a thirteen-tag validation ceiling from a focused eight-tag AI recommendation.

## Requirements

### Requirement: Normalize tags before counting

For note and bookmark create/update operations, the system SHALL trim and lowercase supplied tag strings, reject empty or non-string tags, and deduplicate normalized tags in first-seen order before enforcing the maximum. It SHALL persist the normalized tag set rather than silently truncating it. Malformed supplied tag collections SHALL produce validation errors. Existing resource/channel-specific minimum-tag and blocked-tag rules SHALL remain in force.

#### Scenario: Case and whitespace duplicates
- **WHEN** an otherwise valid entry supplies `JavaScript`, ` javascript `, and `api` as tags
- **THEN** its normalized saved tags are `javascript` and `api` in that order
- **AND** the duplicate consumes no additional slot

#### Scenario: Invalid tag values
- **WHEN** an otherwise valid entry supplies a whitespace-only tag, a non-string tag, or a malformed tag collection
- **THEN** saving fails with a validation error rather than silently dropping or coercing the invalid input
- **AND** REST calls return `ValidationError` with HTTP 400, while MCP calls return an MCP validation/tool error

#### Scenario: Existing minimum-tag behavior
- **WHEN** a bookmark save omits its required tags
- **THEN** the existing missing-tags validation still rejects the save
- **AND** optional tags in MCP note creation do not make bookmark tags optional

### Requirement: Thirteen-tag hard ceiling

Note and bookmark authoring SHALL allow up to thirteen normalized unique tags, subject to existing unrelated validation rules. The ceiling SHALL apply to manual UI input, personal REST create/update calls, and MCP note creation. More than thirteen unique tags SHALL prevent saving with an actionable message naming the maximum. REST failures SHALL use `ValidationError` with HTTP 400; MCP failures SHALL use an MCP validation/tool error and perform no write.

#### Scenario: Thirteen tags are valid
- **WHEN** an otherwise valid note or bookmark has exactly thirteen normalized unique tags
- **THEN** its create or update operation succeeds and retains all thirteen tags
- **AND** the UI does not reject the entry solely for exceeding eight tags

#### Scenario: Fourteen tags are invalid
- **WHEN** an otherwise valid note or bookmark has fourteen normalized unique tags
- **THEN** its create or update operation is rejected without changing persisted data
- **AND** the UI and applicable API report a maximum of thirteen rather than silently saving a subset

#### Scenario: Raw duplicates do not exceed the ceiling
- **WHEN** more than thirteen supplied tag strings normalize to thirteen or fewer unique nonempty tags
- **THEN** the maximum-tag check accepts that normalized set

#### Scenario: Existing over-limit data remains readable
- **WHEN** an existing note has more than thirteen unique tags
- **THEN** reading it does not rewrite, truncate, or reject its stored tags
- **AND** saving an update requires correction to thirteen or fewer unique tags with an explicit validation message

### Requirement: Eight-tag recommendation for AI assistance

MCP note-creation guidance and all note/bookmark refinement prompt variants, including copyable prompts, SHALL strongly recommend at most eight relevant tags where possible. They SHALL distinguish that recommendation from the thirteen-tag hard ceiling and allow justified exceptions or explicit user choices within that ceiling. The system SHALL NOT automatically reduce an entry to eight tags solely to satisfy AI guidance.

#### Scenario: Discoverable recommendation
- **WHEN** an agent reads the MCP creation description or a user invokes/copies a note or bookmark refinement prompt
- **THEN** the guidance recommends at most eight relevant tags where possible while identifying thirteen as the maximum

#### Scenario: Existing ten-tag note is refined
- **WHEN** a user refines an entry with ten valid tags without requesting tag removal
- **THEN** refinement does not automatically remove existing tags merely to reach eight
- **AND** ten tags remain a valid saveable set

### Requirement: Explicit refinement tag merging

Accepting note or bookmark refinement suggestions SHALL merge normalized unique accepted tags with the user's existing tags without an eight-tag cutoff. Existing tags SHALL be preserved unless the user explicitly removes them. If the merged selection exceeds thirteen unique tags, the form SHALL show a validation error and block saving until the user corrects the selection; it SHALL NOT silently discard existing or accepted tags.

#### Scenario: Suggestions fit above eight
- **WHEN** an entry has eight tags and the user accepts three distinct additional suggested tags
- **THEN** the form retains all eleven tags and allows saving

#### Scenario: Repeated suggestions
- **WHEN** accepted suggestions contain duplicates of existing tags or each other after normalization
- **THEN** each normalized tag appears only once in the merged selection

#### Scenario: Suggestions exceed thirteen
- **WHEN** an entry has twelve tags and the user accepts two additional unique tags
- **THEN** all fourteen selected tags remain visible for user correction
- **AND** the form explains the thirteen-tag maximum and blocks saving rather than silently dropping a tag
