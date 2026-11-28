jest.mock('../../common/config', () => ({
  config: jest.fn(),
}));
jest.mock('./public-notes.service', () => ({ getNoteById: jest.fn() }));
jest.mock('./public-bookmarks.service', () => ({ getBookmarkById: jest.fn() }));

const fs = require('fs');
const os = require('os');
const path = require('path');
const cheerio = require('cheerio');
const common = require('../../common/config');
const PublicNotesService = require('./public-notes.service');
const LinkPreviewsService = require('./link-previews.service');

const SITE = 'https://www.codever.dev';
const GENERIC = 'Bookmarks & Notes Manager for Developers';
const INDEX_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script>
      if (/^\\/notes\\/shared\\//.test(window.location.pathname) && 1 < 2) {
        document.title = "x";
      }
    </script>
    <title>Codever</title>
    <meta name="description" content="${GENERIC}" />
    <meta property="og:title" content="${GENERIC}" />
    <meta property="og:description" content="${GENERIC}" />
    <meta property="og:image" content="https://www.codever.dev/assets/img/og-image/codever-og-image.jpeg" />
    <meta name="twitter:title" content="${GENERIC}" />
    <meta name="twitter:description" content="${GENERIC}" />
    <meta name="twitter:image" content="https://www.codever.dev/assets/img/og-image/codever-og-image.jpeg" />
  </head>
  <body><app-root></app-root><script src="main.js" type="module"></script></body>
</html>
`;

const meta = ($, attribute, key) =>
  $(`meta[${attribute}="${key}"]`).attr('content');

describe('markdownToPlainText', () => {
  it.each([
    ['**bold** and *em* and _em_ and ~~gone~~', 'bold and em and em and gone'],
    ['Use `docker ps` to list', 'Use docker ps to list'],
    ['See [the docs](https://x.y) now', 'See the docs now'],
    ['![logo](https://x.y/a.png) Text', 'Text'],
    ['# Title\n\nBody', 'Title Body'],
    ['> quoted\n- item one\n1. item two', 'quoted item one item two'],
    ['before\n```bash\nrm -rf /\n```\nafter', 'before after'],
    ['a <b>bold</b> <br/> tag', 'a bold tag'],
    ['snake_case_name stays', 'snake_case_name stays'],
    ['Tom &amp; Jerry', 'Tom & Jerry'],
    ['', ''],
    [undefined, ''],
  ])('turns %j into %j', (markdown, expected) => {
    expect(LinkPreviewsService.markdownToPlainText(markdown)).toBe(expected);
  });
});

describe('truncateAtWordBoundary', () => {
  it('keeps short text', () => {
    expect(LinkPreviewsService.truncateAtWordBoundary('short text')).toBe(
      'short text'
    );
  });

  it('cuts at a word boundary within 200 characters and adds "…"', () => {
    const text = 'word '.repeat(60).trim();

    const result = LinkPreviewsService.truncateAtWordBoundary(text);

    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.endsWith('word…')).toBe(true);
  });
});

describe('preview builders', () => {
  it('builds a note preview with summary, tags and canonical URL', () => {
    const preview = LinkPreviewsService.buildNotePreview(
      {
        _id: 'abc',
        title: 'Docker cleanup',
        content: '## Clean\nRun `docker system prune` **often**.',
        tags: ['docker', 'devops'],
      },
      SITE
    );

    expect(preview).toEqual({
      title: 'Docker cleanup',
      description: 'Clean Run docker system prune often. #docker #devops',
      url: `${SITE}/notes/abc/details`,
    });
  });

  it('uses only the tags when a note has no text', () => {
    const preview = LinkPreviewsService.buildNotePreview(
      { _id: 'abc', title: 'T', content: '', tags: ['a'] },
      SITE
    );

    expect(preview.description).toBe('#a');
  });

  it('keeps the generic description when there is neither text nor tags', () => {
    const preview = LinkPreviewsService.buildNotePreview(
      { _id: 'abc', title: 'T', content: '```\ncode\n```', tags: [] },
      SITE
    );

    expect(preview.description).toBeNull();
  });

  it('uses the URL host for a bookmark without description', () => {
    const preview = LinkPreviewsService.buildBookmarkPreview(
      {
        _id: 'b1',
        name: 'Probes',
        location: 'https://kubernetes.io/docs/probes',
        tags: ['kubernetes'],
      },
      SITE
    );

    expect(preview).toEqual({
      title: 'Probes',
      description: 'kubernetes.io #kubernetes',
      url: `${SITE}/bookmarks/b1`,
    });
  });
});

describe('applyPreview', () => {
  const preview = {
    title: 'Docker cleanup',
    description: 'Prune often #docker',
    url: `${SITE}/notes/abc/details`,
  };

  it('writes title, description, og and twitter tags, keeping the image', () => {
    const $ = cheerio.load(
      LinkPreviewsService.applyPreview(INDEX_HTML, preview)
    );

    expect($('title').text()).toBe('Docker cleanup');
    expect(meta($, 'name', 'description')).toBe('Prune often #docker');
    expect(meta($, 'property', 'og:title')).toBe('Docker cleanup');
    expect(meta($, 'property', 'og:description')).toBe('Prune often #docker');
    expect(meta($, 'property', 'og:url')).toBe(preview.url);
    expect(meta($, 'property', 'og:type')).toBe('article');
    expect(meta($, 'name', 'twitter:card')).toBe('summary_large_image');
    expect(meta($, 'name', 'twitter:title')).toBe('Docker cleanup');
    expect(meta($, 'name', 'twitter:description')).toBe('Prune often #docker');
    expect(meta($, 'property', 'og:image')).toBe(
      'https://www.codever.dev/assets/img/og-image/codever-og-image.jpeg'
    );
    expect($('meta[property="og:url"]')).toHaveLength(1);
  });

  it('keeps the generic description when the preview has none', () => {
    const $ = cheerio.load(
      LinkPreviewsService.applyPreview(INDEX_HTML, {
        ...preview,
        description: null,
      })
    );

    expect(meta($, 'property', 'og:description')).toBe(GENERIC);
    expect(meta($, 'property', 'og:title')).toBe('Docker cleanup');
  });

  it('escapes HTML characters and leaves scripts unchanged', () => {
    const html = LinkPreviewsService.applyPreview(INDEX_HTML, {
      ...preview,
      title: '<script>alert("x")</script> & \'quotes\'',
    });
    const $ = cheerio.load(html);

    expect($('title').text()).toBe(
      '<script>alert("x")</script> & \'quotes\''
    );
    expect(meta($, 'property', 'og:title')).toBe(
      '<script>alert("x")</script> & \'quotes\''
    );
    // no element is injected: the value stays inside escaped text/attributes
    expect(html).toContain('<title>&lt;script&gt;alert("x")&lt;/script&gt;');
    expect(html).toContain('content="<script>alert(&quot;x&quot;)</script>');
    expect($('script')).toHaveLength(2);
    expect(html).toContain(
      'if (/^\\/notes\\/shared\\//.test(window.location.pathname) && 1 < 2) {'
    );
    expect(html).toContain('<script src="main.js" type="module"></script>');
  });
});

describe('index.html loading', () => {
  let directory;
  let indexPath;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'link-previews-'));
    indexPath = path.join(directory, 'index.html');
    fs.writeFileSync(indexPath, INDEX_HTML);
    common.config.mockReturnValue({
      linkPreviews: { indexHtmlPath: indexPath, siteBaseUrl: SITE },
    });
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('re-reads index.html when its modification time changes', async () => {
    expect(await LinkPreviewsService.loadIndexHtml()).toBe(INDEX_HTML);

    fs.writeFileSync(indexPath, '<html><head></head></html>');
    const later = new Date(Date.now() + 5000);
    fs.utimesSync(indexPath, later, later);

    expect(await LinkPreviewsService.loadIndexHtml()).toBe(
      '<html><head></head></html>'
    );
  });

  it('resolves a relative path against the API folder', async () => {
    const relative = path.relative(path.resolve(__dirname, '../../..'), indexPath);
    common.config.mockReturnValue({
      linkPreviews: { indexHtmlPath: relative, siteBaseUrl: SITE },
    });

    expect(await LinkPreviewsService.loadIndexHtml()).toBe(INDEX_HTML);
  });

  it('fails when index.html is missing', async () => {
    fs.rmSync(indexPath);

    await expect(LinkPreviewsService.loadIndexHtml()).rejects.toThrow();
  });

  it('fails when linkPreviews is not configured', async () => {
    common.config.mockReturnValue({});

    await expect(LinkPreviewsService.loadIndexHtml()).rejects.toThrow(
      'linkPreviews'
    );
  });

  it('builds the note page from the public note', async () => {
    PublicNotesService.getNoteById.mockResolvedValue({
      _id: 'abc',
      title: 'Docker cleanup',
      content: 'Prune often.',
      tags: ['docker'],
    });

    const $ = cheerio.load(await LinkPreviewsService.getNotePage('abc'));

    expect(PublicNotesService.getNoteById).toHaveBeenCalledWith('abc');
    expect(meta($, 'property', 'og:description')).toBe('Prune often. #docker');
    expect(meta($, 'property', 'og:url')).toBe(`${SITE}/notes/abc/details`);
  });
});
