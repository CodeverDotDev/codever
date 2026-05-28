# Collections — Phase 1 Implementation Guide

Code examples based on existing Codever patterns (notes/bookmarks).

---

## 1. Mongoose Model — `apps/codever-api/src/model/collection.js`

```js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionItemSchema = new Schema(
  {
    resourceId: { type: Schema.Types.ObjectId, required: true },
    resourceType: {
      type: String,
      enum: ['bookmark', 'note'],
      required: true,
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const collectionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    userId: { type: String, ref: 'User', required: true },
    items: [collectionItemSchema],
    public: { type: Boolean, default: false },
    color: String,
    lastVisitedAt: Date,
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

// Ensure collection names are unique per user
collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

// Supports default sort (most recently updated first) on My Collections page
collectionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Collection', collectionSchema);
```

---

## 2. Service — `apps/codever-api/src/routes/users/collections/personal-collections.service.js`

```js
const Collection = require('../../../model/collection');
const NotFoundError = require('../../../error/not-found.error');
const ValidationError = require('../../../error/validation.error');

let createCollection = async (userId, collectionData) => {
  if (!collectionData.name || collectionData.name.trim().length === 0) {
    throw new ValidationError('Collection name is required');
  }

  const collection = new Collection({
    name: collectionData.name.trim(),
    description: collectionData.description,
    color: collectionData.color,
    userId: userId,
    public: false, // Phase 1: always private
    items: [],
  });

  return await collection.save();
};

let getUserCollections = async (userId, searchText, page, limit) => {
  const filter = { userId };
  if (searchText) {
    filter.name = { $regex: searchText, $options: 'i' };
  }

  const collections = await Collection.find(filter)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return collections;
};

let getCollectionById = async (userId, collectionId) => {
  const collection = await Collection.findOne({
    _id: collectionId,
    userId: userId,
  });

  if (!collection) {
    throw new NotFoundError(
      `Collection NOT_FOUND for userId: ${userId} AND id: ${collectionId}`
    );
  }

  return collection;
};

let updateCollection = async (userId, collectionId, collectionData) => {
  if (!collectionData.name || collectionData.name.trim().length === 0) {
    throw new ValidationError('Collection name is required');
  }

  const updatedCollection = await Collection.findOneAndUpdate(
    { _id: collectionId, userId: userId },
    {
      $set: {
        name: collectionData.name.trim(),
        description: collectionData.description,
        color: collectionData.color,
      },
    },
    { new: true }
  );

  if (!updatedCollection) {
    throw new NotFoundError(
      `Collection NOT_FOUND with id: ${collectionId}`
    );
  }

  return updatedCollection;
};

let deleteCollectionById = async (userId, collectionId) => {
  const collection = await Collection.findOneAndRemove({
    _id: collectionId,
    userId: userId,
  });

  if (!collection) {
    throw new NotFoundError(
      `Collection NOT_FOUND with id: ${collectionId}`
    );
  }
};

let addItemToCollection = async (userId, collectionId, resourceId, resourceType) => {
  if (!['bookmark', 'note'].includes(resourceType)) {
    throw new ValidationError(
      `Invalid resourceType: ${resourceType}. Must be 'bookmark' or 'note'.`
    );
  }

  const collection = await Collection.findOne({
    _id: collectionId,
    userId: userId,
  });

  if (!collection) {
    throw new NotFoundError(
      `Collection NOT_FOUND with id: ${collectionId}`
    );
  }

  // Prevent duplicates
  const alreadyExists = collection.items.some(
    (item) => item.resourceId.toString() === resourceId && item.resourceType === resourceType
  );
  if (alreadyExists) {
    return collection; // Silently skip — item already in collection
  }

  collection.items.push({ resourceId, resourceType, addedAt: new Date() });
  return await collection.save();
};

let removeItemFromCollection = async (userId, collectionId, resourceId) => {
  const updatedCollection = await Collection.findOneAndUpdate(
    { _id: collectionId, userId: userId },
    { $pull: { items: { resourceId: resourceId } } },
    { new: true }
  );

  if (!updatedCollection) {
    throw new NotFoundError(
      `Collection NOT_FOUND with id: ${collectionId}`
    );
  }

  return updatedCollection;
};

/**
 * Get all collections that contain a specific resource (for checkbox state in dialog)
 */
let getCollectionsContainingResource = async (userId, resourceId) => {
  const collections = await Collection.find({
    userId: userId,
    'items.resourceId': resourceId,
  }).select('_id name color');

  return collections;
};

module.exports = {
  createCollection,
  getUserCollections,
  getCollectionById,
  updateCollection,
  deleteCollectionById,
  addItemToCollection,
  removeItemFromCollection,
  getCollectionsContainingResource,
};
```

---

## 3. Router — `apps/codever-api/src/routes/users/collections/personal-collections.router.js`

```js
const express = require('express');
const personalCollectionsRouter = express.Router({ mergeParams: true });
const Keycloak = require('keycloak-connect');

const PersonalCollectionsService = require('./personal-collections.service');
const UserIdValidator = require('../userid.validator');
const PaginationQueryParamsHelper = require('../../../common/pagination-query-params-helper');

const common = require('../../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes/index');

// Keycloak middleware
const keycloak = new Keycloak({ scope: 'openid' }, config.keycloak);
personalCollectionsRouter.use(keycloak.middleware());

/**
 * CREATE collection
 */
personalCollectionsRouter.post(
  '/',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const newCollection = await PersonalCollectionsService.createCollection(
      request.params.userId,
      request.body
    );

    response
      .set(
        'Location',
        `${config.basicApiUrl}/personal/users/${request.params.userId}/collections/${newCollection.id}`
      )
      .status(HttpStatus.CREATED)
      .send(newCollection);
  }
);

/**
 * GET user's collections (with optional ?q= name filter and pagination)
 */
personalCollectionsRouter.get(
  '/',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const searchText = request.query.q;
    const { page, limit } =
      PaginationQueryParamsHelper.getPageAndLimit(request);

    const collections = await PersonalCollectionsService.getUserCollections(
      request.params.userId,
      searchText,
      page || 1,
      limit || 20
    );

    return response.status(HttpStatus.OK).send(collections);
  }
);

/**
 * GET single collection by ID
 */
personalCollectionsRouter.get(
  '/:collectionId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId } = request.params;
    const collection = await PersonalCollectionsService.getCollectionById(
      userId,
      collectionId
    );

    return response.status(HttpStatus.OK).send(collection);
  }
);

/**
 * GET collections containing a specific resource (for dialog checkbox state)
 */
personalCollectionsRouter.get(
  '/containing/:resourceId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, resourceId } = request.params;
    const collections =
      await PersonalCollectionsService.getCollectionsContainingResource(
        userId,
        resourceId
      );

    return response.status(HttpStatus.OK).send(collections);
  }
);

/**
 * UPDATE collection metadata (name, description, color)
 */
personalCollectionsRouter.put(
  '/:collectionId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId } = request.params;
    const updatedCollection =
      await PersonalCollectionsService.updateCollection(
        userId,
        collectionId,
        request.body
      );

    return response.status(HttpStatus.OK).send(updatedCollection);
  }
);

/**
 * DELETE collection (does NOT delete the bookmarks/notes inside)
 */
personalCollectionsRouter.delete(
  '/:collectionId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId } = request.params;
    await PersonalCollectionsService.deleteCollectionById(userId, collectionId);

    return response.status(HttpStatus.NO_CONTENT).send();
  }
);

/**
 * ADD item (bookmark or note) to collection
 * Body: { resourceId: "...", resourceType: "bookmark" | "note" }
 */
personalCollectionsRouter.post(
  '/:collectionId/items',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId } = request.params;
    const { resourceId, resourceType } = request.body;

    const updatedCollection =
      await PersonalCollectionsService.addItemToCollection(
        userId,
        collectionId,
        resourceId,
        resourceType
      );

    return response.status(HttpStatus.OK).send(updatedCollection);
  }
);

/**
 * REMOVE item from collection
 */
personalCollectionsRouter.delete(
  '/:collectionId/items/:resourceId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId, resourceId } = request.params;

    const updatedCollection =
      await PersonalCollectionsService.removeItemFromCollection(
        userId,
        collectionId,
        resourceId
      );

    return response.status(HttpStatus.OK).send(updatedCollection);
  }
);

module.exports = personalCollectionsRouter;
```

---

## 4. Wire Router — Change in `apps/codever-api/src/routes/users/user.router.js`

```js
// Add after existing require statements:
const personalCollectionsRouter = require('./collections/personal-collections.router');

// Add after existing usersRouter.use lines:
usersRouter.use('/:userId/collections', personalCollectionsRouter);
```

---

## 5. Frontend — TypeScript Interface — `apps/codever-ui/src/app/core/model/collection.ts`

```ts
export interface CollectionItem {
  resourceId: string;
  resourceType: 'bookmark' | 'note';
  addedAt?: Date;
}

export interface Collection {
  _id?: string;
  name: string;
  description?: string;
  userId: string;
  items: CollectionItem[];
  public: boolean;
  color?: string;
  lastVisitedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
```

---

## 6. Frontend — Service — `apps/codever-ui/src/app/core/personal-collections.service.ts`

```ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Collection } from './model/collection';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PersonalCollectionsService {
  private baseUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  private collectionsUrl(userId: string): string {
    return `${this.baseUrl}/personal/users/${userId}/collections`;
  }

  getUserCollections(userId: string, searchText?: string, page = 1, limit = 20): Observable<Collection[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (searchText) {
      params = params.set('q', searchText);
    }

    return this.http.get<Collection[]>(this.collectionsUrl(userId), { params });
  }

  getCollectionById(userId: string, collectionId: string): Observable<Collection> {
    return this.http.get<Collection>(`${this.collectionsUrl(userId)}/${collectionId}`);
  }

  getCollectionsContainingResource(userId: string, resourceId: string): Observable<Collection[]> {
    return this.http.get<Collection[]>(
      `${this.collectionsUrl(userId)}/containing/${resourceId}`
    );
  }

  createCollection(userId: string, collection: Partial<Collection>): Observable<Collection> {
    return this.http.post<Collection>(this.collectionsUrl(userId), collection);
  }

  updateCollection(userId: string, collectionId: string, collection: Partial<Collection>): Observable<Collection> {
    return this.http.put<Collection>(
      `${this.collectionsUrl(userId)}/${collectionId}`,
      collection
    );
  }

  deleteCollection(userId: string, collectionId: string): Observable<void> {
    return this.http.delete<void>(`${this.collectionsUrl(userId)}/${collectionId}`);
  }

  addItemToCollection(
    userId: string,
    collectionId: string,
    resourceId: string,
    resourceType: 'bookmark' | 'note'
  ): Observable<Collection> {
    return this.http.post<Collection>(
      `${this.collectionsUrl(userId)}/${collectionId}/items`,
      { resourceId, resourceType }
    );
  }

  removeItemFromCollection(
    userId: string,
    collectionId: string,
    resourceId: string
  ): Observable<Collection> {
    return this.http.delete<Collection>(
      `${this.collectionsUrl(userId)}/${collectionId}/items/${resourceId}`
    );
  }
}
```

---

## 7. Frontend — Feature Module Scaffold — `apps/codever-ui/src/app/my-collections/`

### `my-collections.module.ts`
```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { MyCollectionsPageComponent } from './my-collections-page.component';
import { CollectionDetailComponent } from './collection-detail/collection-detail.component';

const routes: Routes = [
  { path: '', component: MyCollectionsPageComponent },
  { path: ':collectionId', component: CollectionDetailComponent },
];

@NgModule({
  declarations: [MyCollectionsPageComponent, CollectionDetailComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
})
export class MyCollectionsModule {}
```

### Routing — add to `app.routing.ts`
```ts
{
  path: 'my-collections',
  loadChildren: () =>
    import('./my-collections/my-collections.module').then(
      (m) => m.MyCollectionsModule
    ),
  canActivate: [AuthGuard],
},
```

---

## 8. Frontend — Add-to-Collection Dialog (Angular Material)

Key component: `AddToCollectionDialogComponent`

```ts
// Opened from bookmark/note card button:
this.dialog.open(AddToCollectionDialogComponent, {
  width: '420px',
  data: {
    resourceId: bookmark._id,            // or note._id
    resourceType: 'bookmark',            // or 'note'
    userId: this.userId,
  },
});
```

The dialog component:
1. Calls `getCollectionsContainingResource()` to pre-check boxes
2. Calls `getUserCollections()` to list all with a filter input
3. Checkbox toggles call `addItemToCollection()` / `removeItemFromCollection()`
4. Inline "Create new collection" form at the top

---

## 9. Unit Test Example — `personal-collections.service.test.js`

```js
const PersonalCollectionsService = require('./personal-collections.service');
const Collection = require('../../../model/collection');
const NotFoundError = require('../../../error/not-found.error');
const ValidationError = require('../../../error/validation.error');

jest.mock('../../../model/collection');

describe('PersonalCollectionsService', () => {
  const userId = 'test-user-id';

  afterEach(() => jest.restoreAllMocks());

  describe('createCollection', () => {
    it('should throw ValidationError when name is empty', async () => {
      await expect(
        PersonalCollectionsService.createCollection(userId, { name: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('should create a collection with correct fields', async () => {
      const mockSave = jest.fn().mockResolvedValue({
        _id: 'col-1',
        name: 'My Collection',
        userId,
        items: [],
      });
      Collection.mockImplementation(() => ({ save: mockSave }));

      const result = await PersonalCollectionsService.createCollection(userId, {
        name: 'My Collection',
      });

      expect(result.name).toBe('My Collection');
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('getCollectionById', () => {
    it('should throw NotFoundError when collection does not exist', async () => {
      Collection.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        PersonalCollectionsService.getCollectionById(userId, 'non-existent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('addItemToCollection', () => {
    it('should not duplicate an item already in the collection', async () => {
      const mockCollection = {
        items: [{ resourceId: { toString: () => 'res-1' }, resourceType: 'bookmark' }],
        save: jest.fn().mockResolvedValue(true),
      };
      Collection.findOne = jest.fn().mockResolvedValue(mockCollection);

      await PersonalCollectionsService.addItemToCollection(
        userId, 'col-1', 'res-1', 'bookmark'
      );

      expect(mockCollection.save).not.toHaveBeenCalled();
    });
  });
});
```

---

## 10. Files to Create / Modify — Checklist

### New files
| File | Layer |
|---|---|
| `apps/codever-api/src/model/collection.js` | Backend model |
| `apps/codever-api/src/routes/users/collections/personal-collections.service.js` | Backend service |
| `apps/codever-api/src/routes/users/collections/personal-collections.router.js` | Backend router |
| `apps/codever-api/src/routes/users/collections/personal-collections.service.test.js` | Backend unit test |
| `apps/codever-ui/src/app/core/model/collection.ts` | Frontend model |
| `apps/codever-ui/src/app/core/personal-collections.service.ts` | Frontend service |
| `apps/codever-ui/src/app/my-collections/my-collections.module.ts` | Frontend feature module |
| `apps/codever-ui/src/app/my-collections/my-collections-page.component.ts` | Frontend page |
| `apps/codever-ui/src/app/my-collections/collection-detail/collection-detail.component.ts` | Frontend detail |
| `apps/codever-ui/src/app/shared/add-to-collection-dialog/add-to-collection-dialog.component.ts` | Frontend dialog |

### Modified files
| File | Change |
|---|---|
| `apps/codever-api/src/routes/users/user.router.js` | Import + mount `personalCollectionsRouter` |
| `apps/codever-ui/src/app/app.routing.ts` | Add lazy-loaded route for `my-collections` |
| Left nav component (navigation/sidebar) | Add "My Collections" link |
| Bookmark card / Note card components | Add "Add to collection" button |

