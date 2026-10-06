// Real MongoDB, isolated database; only the external identity provider is stubbed.
// Set COPYABLE_TEST_MONGO_URI for an authenticated local MongoDB instance.
jest.mock('keycloak-connect', () => class {
  middleware() { return (req, res, next) => next(); }
  protect() {
    return (req, res, next) => {
      const subject = req.headers.authorization?.replace(/^Bearer /, '');
      if (!subject) return res.sendStatus(401);
      req.kauth = { grant: { access_token: { content: { sub: subject } } } };
      next();
    };
  }
});
jest.mock('../../common/config', () => ({ config: () => ({ keycloak: {}, basicApiUrl: '/api' }) }));
jest.mock('../ai/ai-refine.service', () => ({}));

require('express-async-errors');
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const ValidationError = require('../../error/validation.error');
const UserIdError = require('./userid-validation.error');
const NotFoundError = require('../../error/not-found.error');
const { migrateCopyableFields } = require('../../../resources/db-migration/mongodb/1791158400000_copyable-fields-text-indexes');
const { adjustBookmarkNoteTextIndexWeights } = require('../../../resources/db-migration/mongodb/1791158400001_adjust-bookmark-note-text-index-weights');

const app = express();
app.use(express.json());
app.use('/api/personal/users/:userId/bookmarks', require('./bookmarks/personal-bookmarks.router'));
app.use('/api/personal/users/:userId/notes', require('./notes/personal-notes.router'));
app.use('/api/public/bookmarks', require('../public/public-bookmarks.router'));
app.use('/api/public/notes', require('../public/public-notes.router'));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error instanceof ValidationError ? 400 : error instanceof UserIdError ? 401 :
    error instanceof NotFoundError ? 404 : 500;
  res.status(status).json({ message: error.message, validationErrors: error.validationErrors });
});

const databaseName = `copyable_fields_test_${process.pid}_${Date.now()}`;
const fields = [{ label: ' Command ', value: ' npm  test ' }, { label: 'Command', value: 'npm build' }];
const normalized = [{ label: 'Command', value: 'npm  test' }, { label: 'Command', value: 'npm build' }];
const origin = { file: 'src/example.ts', project: 'example', workspace: 'workspace' };

beforeAll(async () => {
  await mongoose.connect(process.env.COPYABLE_TEST_MONGO_URI || 'mongodb://127.0.0.1:27017', {
    dbName: databaseName, serverSelectionTimeoutMS: 5000,
  });
  await Promise.all([Bookmark.createCollection(), Note.createCollection()]);
  await migrateCopyableFields(mongoose.connection.db);
  await adjustBookmarkNoteTextIndexWeights(mongoose.connection.db);
}, 20000);
beforeEach(async () => { await Promise.all([Bookmark.deleteMany({}), Note.deleteMany({})]); });
afterAll(async () => {
  if (mongoose.connection.name === databaseName) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe.each([
  ['bookmarks', Bookmark, 'name', 'description', 'full_text_search'],
  ['notes', Note, 'title', 'content', 'notes_full_text_search'],
])('%s copyable fields', (resource, Model, titleKey, contentKey, indexName) => {
  const base = (extra = {}) => ({
    userId: 'owner', [titleKey]: 'Example', [contentKey]: 'Some content',
    location: 'https://example.com', tags: ['example'], public: true,
    ...(resource === 'notes' ? { origin } : {}), ...extra,
  });
  const url = (owner = 'owner') => `/api/personal/users/${owner}/${resource}`;
  const post = (body, owner = 'owner') => request(app).post(url(owner)).set('Authorization', `Bearer ${owner}`).send(body);
  const put = (id, body, owner = 'owner') => request(app).put(`${url(owner)}/${id}`).set('Authorization', `Bearer ${owner}`).send(body);
  const get = (id, owner = 'owner') => request(app).get(`${url(owner)}/${id}`).set('Authorization', `Bearer ${owner}`);
  const idOf = response => response.headers.location.split('/').pop();

  test('create, public/private reads, update, copy-to-mine independence and clear', async () => {
    const created = await post(base({ copyableFields: fields }));
    expect(created.status).toBe(201);
    const id = idOf(created);
    const read = await get(id);
    expect(read.body.copyableFields).toEqual(normalized);
    const publicRead = await request(app).get(`/api/public/${resource}/${id}`);
    expect(publicRead.status).toBe(200);
    expect(publicRead.body.copyableFields).toEqual(normalized);
    const copied = await post({ ...read.body, userId: 'other', public: false }, 'other');
    expect(copied.status).toBe(201);
    const copyId = idOf(copied);
    expect(copyId).not.toBe(id);
    const copy = await get(copyId, 'other');
    expect(copy.body.copyableFields).toEqual(normalized);
    if (resource === 'notes') expect(copy.body.origin).toEqual(origin);
    expect((await request(app).get(`/api/public/${resource}/${copyId}`)).status).toBe(404);
    const update = await put(copyId, { ...copy.body, copyableFields: [{ label: 'New', value: 'changed' }] }, 'other');
    expect(update.status).toBe(200);
    expect((await get(copyId, 'other')).body.copyableFields[0].value).toBe('changed');
    expect((await get(id)).body.copyableFields).toEqual(normalized);
    expect((await put(id, { ...read.body, copyableFields: [] })).status).toBe(200);
    expect((await get(id)).body.copyableFields).toEqual([]);
  });

  test('omitted fields work for legacy clients and preserve existing fields on update', async () => {
    const created = await post(base());
    expect(created.status).toBe(201);
    const id = idOf(created);
    const read = await get(id);
    expect(read.body.copyableFields).toBeUndefined();
    await put(id, { ...read.body, copyableFields: normalized });
    expect((await put(id, { ...read.body, [titleKey]: 'Updated title' })).status).toBe(200);
    expect((await get(id)).body.copyableFields).toEqual(normalized);
  });

  test('authentication, ownership and invalid fields reject before persistence', async () => {
    expect((await request(app).post(url()).send(base({ copyableFields: fields }))).status).toBe(401);
    expect((await request(app).post(url('other')).set('Authorization', 'Bearer owner').send(base())).status).toBe(401);
    for (const value of [null, [{ label: 'x', value: 123 }], [{ label: 'x', value: 'a\nb' }], Array(11).fill(fields[0])]) {
      expect((await post(base({ copyableFields: value }))).status).toBe(400);
    }
    expect(await Model.countDocuments({})).toBe(0);
    const created = await post(base({ copyableFields: fields }));
    const id = idOf(created);
    const read = await get(id);
    expect((await put(id, { ...read.body, copyableFields: [{ label: '', value: 'x' }] })).status).toBe(400);
    expect((await get(id)).body.copyableFields).toEqual(normalized);
    expect((await get(id, 'other')).status).toBe(404);
  });

  test('real text scores favor comparable titles over tags and low-weight fields', async () => {
    const term = 'zephyrquartz';
    const docs = await Model.create([
      base({ [titleKey]: term, tags: [], [contentKey]: '', location: 'https://example.com/title' }),
      base({ tags: [term], [contentKey]: '', location: 'https://example.com/tag' }),
      base({ tags: [], [contentKey]: term, location: 'https://example.com/content' }),
      base({ tags: [], [contentKey]: '', location: 'https://example.com/value', copyableFields: [{ label: 'Label', value: term }] }),
      base({ tags: [], [contentKey]: '', location: 'https://example.com/label', copyableFields: [{ label: term, value: 'Value' }] }),
    ]);
    const response = await request(app).get(url()).set('Authorization', 'Bearer owner').query({ q: term });
    expect(response.status).toBe(200);
    const ids = response.body.map(doc => doc._id);
    expect(ids).toHaveLength(5);
    expect(ids.indexOf(String(docs[0]._id))).toBeLessThan(ids.indexOf(String(docs[1]._id)));
    expect(ids.indexOf(String(docs[2]._id))).toBeLessThan(ids.indexOf(String(docs[3]._id)));
    const publicSearch = await request(app).get(`/api/public/${resource}`).query({ q: term });
    expect(publicSearch.status).toBe(200);
    expect(publicSearch.body.some(doc => doc._id === String(docs[3]._id))).toBe(true);
    const index = (await Model.collection.indexes()).find(item => item.name === indexName);
    expect(index.weights.tags).toBe(8);
    expect(index.weights[titleKey]).toBe(21);
    expect(index.weights['copyableFields.label']).toBe(1);
    expect(index.weights['copyableFields.value']).toBe(1);
  });

  test('multi-term tag matches remain searchable without changing primary weights', async () => {
    const title = await Model.create(base({ [titleKey]: 'zephyr quartz', tags: [], [contentKey]: '' }));
    const tagged = await Model.create(base({ tags: ['zephyr', 'quartz'], [contentKey]: '', location: 'https://example.com/tags' }));
    const result = await request(app).get(url()).set('Authorization', 'Bearer owner').query({ q: 'zephyr quartz' });
    expect(result.status).toBe(200);
    expect(result.body.map(doc => doc._id)).toEqual(
      expect.arrayContaining([String(title._id), String(tagged._id)])
    );
    const index = (await Model.collection.indexes()).find(item => item.name === indexName);
    expect(index.weights[titleKey]).toBe(21);
    expect(index.weights.tags).toBe(8);
  });
});

test('migration, rollback, re-run, alternate index name, and initializer parity', async () => {
  const db = mongoose.connection.db;
  await Bookmark.collection.createIndex({ userId: 1 }, { name: 'keep_me' });
  await migrateCopyableFields(db, true);
  for (const Model of [Bookmark, Note]) {
    const index = (await Model.collection.indexes()).find(item => item.weights);
    expect(index.weights.tags).toBe(21);
    expect(index.weights['copyableFields.value']).toBeUndefined();
  }
  await Bookmark.collection.dropIndex('full_text_search');
  await Bookmark.collection.createIndex({ name: 'text' }, { name: 'bookmarks_full_text_search' });
  await migrateCopyableFields(db);
  await migrateCopyableFields(db);
  await adjustBookmarkNoteTextIndexWeights(db);
  const bookmarkIndexes = await Bookmark.collection.indexes();
  expect(bookmarkIndexes.some(index => index.name === 'keep_me')).toBe(true);
  expect(bookmarkIndexes.find(index => index.weights).name).toBe('bookmarks_full_text_search');
  const captured = {};
  const fakeDb = Object.fromEntries(['bookmarks', 'notes', 'snippets'].map(name => [name, {
    createIndex: (keys, options) => { if (options?.weights) captured[name] = options; },
  }]));
  const initializer = fs.readFileSync(path.resolve(__dirname, '../../../../../docker-compose-setup/init-mongo.js'), 'utf8');
  vm.runInNewContext(initializer.slice(initializer.indexOf('//bookmarks indexes')), { db: fakeDb });
  for (const Model of [Bookmark, Note]) {
    const index = (await Model.collection.indexes()).find(item => item.weights);
    expect(index.weights).toEqual(captured[Model.collection.name].weights);
    expect(index.default_language).toBe('none');
  }
}, 20000);

