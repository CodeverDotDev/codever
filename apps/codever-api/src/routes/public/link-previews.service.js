const fs = require('fs/promises');
const path = require('path');
const cheerio = require('cheerio');

const common = require('../../common/config');
const PublicNotesService = require('./public-notes.service');
const PublicBookmarksService = require('./public-bookmarks.service');

const MAX_SUMMARY_LENGTH = 200;

const HTML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/**
 * Reduces Markdown to plain text for a link preview: code blocks and images
 * are removed, links, emphasis, inline code, headings, list and quote
 * markers and HTML tags are reduced to their text.
 */
function markdownToPlainText(markdown) {
  if (!markdown) {
    return '';
  }
  return (
    markdown
      // fenced code blocks
      .replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n\1[^\n]*|$)/gm, ' ')
      // images, then inline and reference links
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/!\[[^\]]*\]\[[^\]]*\]/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
      // reference link definitions
      .replace(/^\s*\[[^\]]+\]:\s+\S+.*$/gm, ' ')
      // autolinks keep their URL, other HTML tags are dropped
      .replace(/<((?:https?|mailto):[^>\s]+)>/g, '$1')
      .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
      // headings, quotes, list markers, horizontal rules, table separators
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/gm, '')
      .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, ' ')
      .replace(/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/gm, ' ')
      // inline code and emphasis markers
      .replace(/`+([^`]*)`+/g, '$1')
      .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '$2')
      .replace(/(^|[^\w*])\*(?=\S)([^*\n]*?\S)\*(?!\w)/g, '$1$2')
      .replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1$2')
      .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '$1')
      .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity])
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Cuts text to at most `maxLength` characters at a word boundary with "…". */
function truncateAtWordBoundary(text, maxLength = MAX_SUMMARY_LENGTH) {
  if (text.length <= maxLength) {
    return text;
  }
  let cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) {
    cut = cut.slice(0, lastSpace);
  }
  return `${cut.replace(/[\s.,;:!?-]+$/, '')}…`;
}

function hostOf(location) {
  try {
    return new URL(location).host;
  } catch {
    return '';
  }
}

/**
 * The preview description: the summary followed by the tags as `#tag`;
 * null when there is neither, so the generic description is kept.
 */
function buildDescription(summary, tags) {
  const hashTags = (tags || []).map((tag) => `#${tag}`).join(' ');
  const description = [summary, hashTags].filter(Boolean).join(' ');
  return description || null;
}

function buildNotePreview(note, siteBaseUrl) {
  const summary = truncateAtWordBoundary(markdownToPlainText(note.content));
  return {
    title: note.title,
    description: buildDescription(summary, note.tags),
    url: `${siteBaseUrl}/notes/${note._id}/details`,
  };
}

function buildBookmarkPreview(bookmark, siteBaseUrl) {
  const summary =
    truncateAtWordBoundary(markdownToPlainText(bookmark.description)) ||
    hostOf(bookmark.location);
  return {
    title: bookmark.name,
    description: buildDescription(summary, bookmark.tags),
    url: `${siteBaseUrl}/bookmarks/${bookmark._id}`,
  };
}

function setMeta($, attribute, key, value) {
  let element = $(`meta[${attribute}="${key}"]`);
  if (element.length === 0) {
    element = $('<meta>').attr(attribute, key);
    $('head').append(element);
  }
  element.attr('content', value);
}

/**
 * Writes the preview into the page: title, description, Open Graph and
 * Twitter tags. Missing tags are added; the images stay as built.
 */
function applyPreview(html, preview) {
  const $ = cheerio.load(html);

  let title = $('head > title');
  if (title.length === 0) {
    title = $('<title></title>');
    $('head').append(title);
  }
  title.text(preview.title);

  setMeta($, 'property', 'og:title', preview.title);
  setMeta($, 'name', 'twitter:title', preview.title);
  if (preview.description) {
    setMeta($, 'name', 'description', preview.description);
    setMeta($, 'property', 'og:description', preview.description);
    setMeta($, 'name', 'twitter:description', preview.description);
  }
  setMeta($, 'property', 'og:url', preview.url);
  setMeta($, 'property', 'og:type', 'article');
  setMeta($, 'name', 'twitter:card', 'summary_large_image');

  return $.html();
}

let indexHtmlCache = null;

function linkPreviewsConfig() {
  const linkPreviews = common.config().linkPreviews;
  if (!linkPreviews?.indexHtmlPath || !linkPreviews?.siteBaseUrl) {
    throw new Error('linkPreviews.indexHtmlPath and siteBaseUrl are required');
  }
  return linkPreviews;
}

// relative paths in env.json are resolved against the API folder
const API_ROOT = path.resolve(__dirname, '../../..');

/** The app's index.html, re-read when its modification time changes. */
async function loadIndexHtml() {
  const indexHtmlPath = path.resolve(
    API_ROOT,
    linkPreviewsConfig().indexHtmlPath
  );
  const { mtimeMs } = await fs.stat(indexHtmlPath);
  if (
    !indexHtmlCache ||
    indexHtmlCache.path !== indexHtmlPath ||
    indexHtmlCache.mtimeMs !== mtimeMs
  ) {
    const html = await fs.readFile(indexHtmlPath, 'utf8');
    indexHtmlCache = { path: indexHtmlPath, mtimeMs, html };
  }
  return indexHtmlCache.html;
}

const getGenericPage = () => loadIndexHtml();

async function getNotePage(noteId) {
  const html = await loadIndexHtml();
  const note = await PublicNotesService.getNoteById(noteId);
  return applyPreview(
    html,
    buildNotePreview(note, linkPreviewsConfig().siteBaseUrl)
  );
}

async function getBookmarkPage(bookmarkId) {
  const html = await loadIndexHtml();
  const bookmark = await PublicBookmarksService.getBookmarkById(bookmarkId);
  return applyPreview(
    html,
    buildBookmarkPreview(bookmark, linkPreviewsConfig().siteBaseUrl)
  );
}

module.exports = {
  markdownToPlainText,
  truncateAtWordBoundary,
  buildNotePreview,
  buildBookmarkPreview,
  applyPreview,
  loadIndexHtml,
  getGenericPage,
  getNotePage,
  getBookmarkPage,
};
