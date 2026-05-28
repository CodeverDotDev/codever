# Add Collections to Codever

## Overview

Introduce **collections** — a way to group bookmarks and notes into named, user-defined sets for better
organisation beyond tags. Collections complement tagging by allowing the same item to belong to multiple
curated groups (e.g. "Spring Boot microservices project", "Interview prep", "Team onboarding links").

---

## Decisions

| Question | Decision | Rationale |
|---|---|---|
| What can a collection contain? | Bookmarks **and** notes (mixed) | Both are core resource types the user manages daily |
| Public or private? | **Private-only** in Phase 1 (`public: false`) | Platform focus is personal productivity; schema includes `public` field for future use |
| Nesting / sub-collections? | **Flat (no nesting)** in Phase 1 | Keeps data model, queries, and UI simple; good naming + search is sufficient for personal use |
| Search for collections in top search box? | **No** — dedicated "My Collections" page with local filter | Top search is already rich (bookmarks, notes, tags); avoids clutter. Can be revisited in Phase 2 |
| Replace Feed as landing page? | **No** — keep Feed as-is; add "My Collections" as prominent nav entry | Some users may still use Feed; track usage and revisit later |
| How to add/remove items from collections? | **Button on each bookmark/note card → dialog** with collection list, checkboxes, and search | Standard UX pattern (Google Bookmarks, Notion, etc.) |
| Where in left navigation? | **Dashboard → My Collections → My Notes → My Bookmarks** (logged in); hide "My Collections" when logged out | Gives collections high visibility without disrupting existing nav |
| Management page? | **Yes** — "My Collections" page in dashboard: list, create, edit, delete, view contents | Central hub for collection management |

---

## Phased Rollout

### Phase 1 — MVP (this phase)
- Mongoose schema for `Collection`
- CRUD API endpoints (personal routes, Keycloak-protected)
- Add/remove bookmarks and notes to/from collections (API + UI dialog)
- "My Collections" page in dashboard (list all, click to view contents, inline name filter)
- "My Collections" entry in left navigation (logged-in users only; CTA page for logged-out users)

### Phase 2 — Discoverability
- Add "Collections" tab in global search results
- "Recent Collections" widget on home/dashboard
- Sort collections by last-visited / last-updated
- Collection ordering / manual reorder of items within a collection

### Phase 3 — Sharing & Public
- `public: true` support — public collections visible to anyone
- Share collection via link
- Public collections in search results

### Phase 4 — Nesting (if needed)
- One level of sub-collections (`parentCollectionId`)
- UI tree rendering + drag-and-drop

---

## Phase 1 — Detailed Requirements

### 1. Data Model

A collection belongs to a single user and holds an ordered list of references to bookmarks and/or notes.

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | ✅ | Unique per user |
| `description` | String | | Optional short description |
| `userId` | String (ref User) | ✅ | Owner |
| `items` | Array of `{ resourceId, resourceType, addedAt }` | | Mixed bookmark/note refs |
| `items.resourceId` | ObjectId | ✅ | References `Bookmark` or `Note` |
| `items.resourceType` | String enum `['bookmark','note']` | ✅ | Discriminator |
| `items.addedAt` | Date | | Defaults to `Date.now` |
| `public` | Boolean | | Always `false` in Phase 1 |
| `color` | String | | Optional UI accent color |
| `lastVisitedAt` | Date | | Updated when user opens the collection |
| `createdAt` | Date | | Mongoose timestamps |
| `updatedAt` | Date | | Mongoose timestamps |

**Indexes:**
- `{ userId: 1, name: 1 }` — unique compound (enforces name uniqueness per user, speeds up list + filter)
- `{ userId: 1, updatedAt: -1 }` — supports default sort on My Collections page

**Why no `tags[]` on collections?**
Tags are the primary discovery axis for bookmarks/notes. Collections sit *above* that as a grouping layer.
Adding tags to collections would require tag management UI, tag search, tag pages — too much surface area for
a personal set of ~10–50 collections. The name filter on the My Collections page is sufficient. Revisit if
users accumulate 100+ collections and need categorisation beyond name search.

**Why no text index on `description`?**
Description is only displayed, never searched. The name filter uses `$regex` over a small per-user subset
(already narrowed by the userId index), so a separate text index adds overhead with no practical benefit.

### 2. API Endpoints

Base path: `/api/personal/users/:userId/collections`

All routes require `keycloak.protect()` + `UserIdValidator.validateUserId(request)`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Create a new collection |
| `GET` | `/` | List user's collections (with `?q=` name filter, pagination) |
| `GET` | `/:collectionId` | Get a single collection with populated items |
| `PUT` | `/:collectionId` | Update collection (name, description, color) |
| `DELETE` | `/:collectionId` | Delete collection (does NOT delete the bookmarks/notes) |
| `POST` | `/:collectionId/items` | Add an item (bookmark or note) to the collection |
| `DELETE` | `/:collectionId/items/:resourceId` | Remove an item from the collection |

### 3. Frontend Components

| Component / Location | Description |
|---|---|
| **Left nav** | "My Collections" link between Dashboard and My Notes (logged in); hidden or CTA when logged out |
| **My Collections page** (`my-collections/`) | Lazy-loaded feature module. Lists all collections as cards/rows with name, description, item count, last updated. Filter bar at top. "New Collection" button. |
| **Collection detail view** | Shows collection name, description, and the list of bookmarks/notes inside it. Items displayed using existing bookmark-card / note-card components. |
| **Add-to-collection dialog** | Triggered from a button (folder icon) on bookmark/note cards. Shows user's collections with checkboxes, "Create new" option at top, search/filter. |
| **Collection CRUD dialog** | Create / edit collection — name, description, color picker. Used from My Collections page and from add-to-collection dialog ("Create new"). |

### 4. Navigation Changes

**Logged in — left nav order:**
1. Dashboard
2. **My Collections** ← NEW
3. My Notes
4. My Bookmarks

**Logged out — left nav:**
- Hide "My Collections" entirely, or show it linking to a promo/login-CTA page with screenshots, benefits description, and login/signup button.

---

## Non-Goals (Phase 1)
- Public/shared collections
- Nested collections
- Collections in the global search box
- Drag-and-drop reorder within collections
- Bulk add/remove
