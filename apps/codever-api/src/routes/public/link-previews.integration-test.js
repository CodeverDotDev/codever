const fs = require('fs');
const os = require('os');
const path = require('path');

const mockIndexDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'link-previews-it-'));
const mockIndexHtmlPath = path.join(mockIndexDirectory, 'index.html');
const MOCK_SITE = 'https://www.codever.dev';
const GENERIC = 'Bookmarks &amp; Notes Manager for Developers';

jest.mock('../../common/config', () => ({
  config: () => ({
    keycloak: {},
    linkPreviews: { indexHtmlPath: mockIndexHtmlPath, siteBaseUrl: MOCK_SITE },
  }),
}));

const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const cheerio = require('cheerio');
const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');

const INDEX_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Codever</title>
    <meta name="description" content="${GENERIC}" />
    <meta property="og:title" content="${GENERIC}" />
    <meta property="og:description" content="${GENERIC}" />
    <meta name="twitter:title" content="${GENERIC}" />
    <meta name="twitter:description" content="${GENERIC}" />
  </head>
  <body><app-root></app-root></body>
</html>
`;

const app = express();
app.use('/api/public/link-previews', require('./link-previews.router'));

const databaseName = `link_previews_test_${process.pid}_${Date.now()}`;
const base = '/api/public/link-previews';
const meta = ($, attribute, key) =>
  $(`meta[${attribute}="${key}"]`).attr('content');

let publicNoteId;
let privateNoteId;
let publicBookmarkId;

beforeAll(async () => {
  await mongoose.connect(
    process.env.COPYABLE_TEST_MONGO_URI ||
      'mongodb://mongoadmin:secret@127.0.0.1:27017/?authSource=admin',
    { dbName: databaseName, serverSelectionTimeoutMS: 5000 }
  );
  await Promise.all([Bookmark.createCollection(), Note.createCollection()]);
}, 20000);

beforeEach(async () => {
  fs.writeFileSync(mockIndexHtmlPath, INDEX_HTML);
  await Promise.all([Bookmark.deleteMany({}), Note.deleteMany({})]);
  publicNoteId = new mongoose.Types.ObjectId();
  privateNoteId = new mongoose.Types.ObjectId();
  publicBookmarkId = new mongoose.Types.ObjectId();
  await Promise.all([
    Note.create({
      _id: publicNoteId,
      userId: 'owner',
      title: 'Docker cleanup',
      content: 'Run `docker system prune` **often**.',
      tags: ['docker', 'devops'],
      public: true,
    }),
    Note.create({
      _id: privateNoteId,
      userId: 'owner',
      title: 'Secret plan',
      content: 'Private content',
      tags: ['secret'],
      public: false,
    }),
    Bookmark.create({
      _id: publicBookmarkId,
      userId: 'owner',
      name: 'Kubernetes probes',
      location: 'https://kubernetes.io/docs/probes',
      tags: ['kubernetes'],
      public: true,
    }),
  ]);
});

afterAll(async () => {
  if (mongoose.connection.name === databaseName) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
  fs.rmSync(mockIndexDirectory, { recursive: true, force: true });
});

const expectHtml = (response) => {
  expect(response.status).toBe(200);
  expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
  expect(response.headers['cache-control']).toBe('no-cache');
  return cheerio.load(response.text);
};

const expectGeneric = (response) => {
  const $ = expectHtml(response);
  expect(response.text).toBe(INDEX_HTML);
  expect($('title').text()).toBe('Codever');
  return $;
};

test('serves preview tags for a public note', async () => {
  const $ = expectHtml(await request(app).get(`${base}/notes/${publicNoteId}`));

  expect($('title').text()).toBe('Docker cleanup');
  expect(meta($, 'property', 'og:title')).toBe('Docker cleanup');
  expect(meta($, 'property', 'og:description')).toBe(
    'Run docker system prune often. #docker #devops'
  );
  expect(meta($, 'property', 'og:url')).toBe(
    `${MOCK_SITE}/notes/${publicNoteId}/details`
  );
  expect(meta($, 'property', 'og:type')).toBe('article');
  expect(meta($, 'name', 'twitter:card')).toBe('summary_large_image');
});

test('serves preview tags for a public bookmark without description', async () => {
  const $ = expectHtml(
    await request(app).get(`${base}/bookmarks/${publicBookmarkId}`)
  );

  expect(meta($, 'property', 'og:title')).toBe('Kubernetes probes');
  expect(meta($, 'property', 'og:description')).toBe(
    'kubernetes.io #kubernetes'
  );
  expect(meta($, 'property', 'og:url')).toBe(
    `${MOCK_SITE}/bookmarks/${publicBookmarkId}`
  );
});

test('serves the generic page for a private note without revealing it', async () => {
  const response = await request(app).get(`${base}/notes/${privateNoteId}`);

  expectGeneric(response);
  expect(response.text).not.toContain('Secret plan');
  expect(response.text).not.toContain('Private content');
});

test('serves the generic page for missing and invalid ids', async () => {
  const missingId = new mongoose.Types.ObjectId();

  expectGeneric(await request(app).get(`${base}/notes/${missingId}`));
  expectGeneric(await request(app).get(`${base}/bookmarks/${missingId}`));
  expectGeneric(await request(app).get(`${base}/notes/not-an-id`));
  expectGeneric(await request(app).get(`${base}/bookmarks/not-an-id`));
});

test('reflects edits and a note made private', async () => {
  await Note.updateOne(
    { _id: publicNoteId },
    { title: 'Docker cleanup v2', tags: ['docker'] }
  );
  let $ = expectHtml(await request(app).get(`${base}/notes/${publicNoteId}`));
  expect(meta($, 'property', 'og:title')).toBe('Docker cleanup v2');
  expect(meta($, 'property', 'og:description')).toMatch(/#docker$/);

  await Note.updateOne({ _id: publicNoteId }, { public: false });
  const response = await request(app).get(`${base}/notes/${publicNoteId}`);
  expectGeneric(response);
  expect(response.text).not.toContain('Docker cleanup');
});

test('answers 503 when the app page is not available', async () => {
  fs.rmSync(mockIndexHtmlPath);

  const publicResponse = await request(app).get(
    `${base}/notes/${publicNoteId}`
  );
  const privateResponse = await request(app).get(
    `${base}/notes/${privateNoteId}`
  );

  expect(publicResponse.status).toBe(503);
  expect(privateResponse.status).toBe(503);
  expect(privateResponse.text).not.toContain('Secret plan');
});
