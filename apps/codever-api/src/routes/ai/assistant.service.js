const request = require('superagent');
const HttpStatus = require('http-status-codes/index');
const mcpToolsService = require('../../mcp/mcp-tools.service');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat'; // fast/standard model, same as ai-refine

// How many of the user's own entries to retrieve and feed to the model as
// grounding context (Level 1 RAG). Kept small to bound prompt size / cost.
const MAX_CONTEXT_RESULTS = 8;
// How many previous turns of the conversation to keep for follow-up questions.
const MAX_HISTORY_MESSAGES = 6;

// Noise words removed before turning a natural-language question into a search
// query. These are common English fillers plus Codever domain nouns/verbs
// ("bookmark", "note", "tagged", …) that would otherwise pollute the search.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'my', 'me', 'mine', 'our', 'your', 'i', 'we',
  'find', 'show', 'search', 'searching', 'list', 'get', 'give', 'tell',
  'summarize', 'summarise', 'summary', 'explain', 'describe', 'description',
  'overview', 'compare', 'comparison',
  'what', 'whats', 'which', 'who', 'where', 'when', 'how', 'why', 'did',
  'do', 'does', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'can',
  'about', 'regarding', 'related', 'to', 'with', 'for', 'of', 'on', 'in',
  'and', 'or', 'any', 'all', 'some', 'that', 'this', 'these', 'those',
  'please', 'bookmark', 'bookmarks', 'note', 'notes', 'snippet', 'snippets',
  'tag', 'tags', 'tagged', 'entry', 'entries', 'saved', 'save', 'resource',
  'resources',
]);

const SYSTEM_PROMPT = `You are "Ask Codever", a helpful assistant embedded in Codever, a personal bookmarks and notes manager.
You answer the user's question using ONLY the CONTEXT below, which contains excerpts from the user's own bookmarks and notes.

Rules:
- Base your answer on the provided context. If the context does not contain enough information, say so plainly and suggest how the user might refine their question or what they could save to Codever.
- Be concise and use Markdown (headings, lists, fenced code blocks) where helpful.
- When you use information from a specific entry, mention its title so the user can connect it to the reference cards shown alongside your answer.
- Never invent bookmarks, notes, URLs, or facts that are not in the context.`;

/**
 * Turn a natural-language question into a recall-oriented search query:
 * drop quotes/punctuation and filler words so meaningful terms (e.g. a tag
 * name like "emoji") drive the search. Combined with OR semantics this keeps
 * relevant entries from being excluded by noise words. Falls back to the raw
 * message if stripping removed everything.
 *
 * @param {string} message
 * @returns {string}
 */
function buildSearchQuery(message) {
  const raw = String(message || '').trim();
  const cleaned = raw
    .toLowerCase()
    .replace(/["'`\u2018\u2019\u201c\u201d]/g, ' ')
    .replace(/[?!.,;:()\[\]{}]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .join(' ')
    .trim();
  return cleaned || raw;
}

/**
 * Infer which resource types the user is asking about from their wording so a
 * question like "summarize my notes on Tennis" returns only notes (and
 * "my bookmarks about X" only bookmarks). Snippets were migrated to notes, so
 * "snippet(s)" maps to notes too. Returns `undefined` when the intent is
 * ambiguous or mentions both, letting the search cover bookmarks AND notes.
 *
 * @param {string} message
 * @returns {('bookmark'|'note')[]|undefined}
 */
function detectTypes(message) {
  const text = String(message || '').toLowerCase();
  const mentionsNote = /\bnotes?\b/.test(text) || /\bsnippets?\b/.test(text);
  const mentionsBookmark = /\bbookmarks?\b/.test(text);
  if (mentionsNote && !mentionsBookmark) {
    return ['note'];
  }
  if (mentionsBookmark && !mentionsNote) {
    return ['bookmark'];
  }
  return undefined; // ambiguous or both → search everything
}

/**
 * Turn the retrieved entries into a compact, model-friendly context block.
 *
 * @param {object[]} results - Normalized entries from mcp-tools.searchEntries
 * @returns {string}
 */
function buildContextBlock(results) {
  if (!results || results.length === 0) {
    return '(no matching bookmarks or notes were found for this question)';
  }

  return results
    .map((entry, index) => {
      const lines = [
        `[${index + 1}] (${entry.type}) ${entry.title || '(untitled)'}`,
      ];
      if (entry.url) {
        lines.push(`URL: ${entry.url}`);
      }
      if (entry.tags && entry.tags.length > 0) {
        lines.push(`Tags: ${entry.tags.join(', ')}`);
      }
      if (entry.excerpt) {
        lines.push(`Excerpt: ${entry.excerpt}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

/**
 * Keep only well-formed, recent history turns so a caller cannot inject
 * arbitrary roles or an unbounded transcript into the prompt.
 *
 * @param {Array<{role: string, content: string}>} history
 * @returns {Array<{role: 'user'|'assistant', content: string}>}
 */
function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim()
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Map the retrieved entries to the compact reference shape returned to the UI,
 * where they are rendered as clickable Codever cards next to the answer.
 *
 * @param {object[]} results
 * @returns {Array<{type: string, id: string, title: string, url?: string, excerpt: string}>}
 */
function toReferences(results) {
  return (results || []).map((entry) => ({
    type: entry.type,
    id: entry.id,
    title: entry.title,
    url: entry.url,
    excerpt: entry.excerpt,
  }));
}

/**
 * Answer a natural-language question over the user's own bookmarks and notes.
 *
 * Flow (Level 1 RAG): retrieve the most relevant entries with the existing
 * read-only search, build a grounded prompt, call DeepSeek once, and return the
 * answer together with the structured references used as context.
 *
 * @param {string} userId - The authenticated Keycloak user ID (scopes retrieval)
 * @param {object} params
 * @param {string} params.message - The user's question
 * @param {Array<{role: string, content: string}>} [params.history] - Prior turns
 * @returns {Promise<{answer: string, references: object[]}>}
 */
const askAssistant = async function (userId, { message, history = [] }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. Please set it in the environment.'
    );
  }

  // 1. Retrieve the user's own most relevant entries (read-only, user-scoped).
  //    Use a cleaned query + OR semantics so a question like
  //    'Find bookmarks tagged "emoji"' still matches the "emoji" tag.
  //    Respect the type intent in the wording ("my notes" / "my bookmarks")
  //    so the answer and references stay scoped to what the user asked for.
  const types = detectTypes(message);
  const { results } = await mcpToolsService.searchEntries(userId, {
    text: buildSearchQuery(message),
    types,
    limit: MAX_CONTEXT_RESULTS,
    searchInclude: 'any',
  });
  const contextResults = (results || []).slice(0, MAX_CONTEXT_RESULTS);

  // 2. Build the grounded prompt.
  const contextBlock = buildContextBlock(contextResults);
  const userMessage = `CONTEXT (the user's own bookmarks and notes):
${contextBlock}

QUESTION:
${message}`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...sanitizeHistory(history),
    { role: 'user', content: userMessage },
  ];

  // 3. Call DeepSeek once and return the answer + the references used.
  try {
    const response = await request
      .post(DEEPSEEK_API_URL)
      .set('Authorization', `Bearer ${apiKey}`)
      .set('Content-Type', 'application/json')
      .timeout(30000) // 30 second timeout
      .send({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 2048,
      });

    if (response.statusCode === HttpStatus.OK) {
      const answer = response.body.choices[0].message.content;
      return {
        answer,
        references: toReferences(contextResults),
      };
    }

    throw new Error(
      `DeepSeek API returned unexpected status: ${response.statusCode}`
    );
  } catch (err) {
    // Distinguish between network errors (site unreachable) and API errors,
    // mirroring ai-refine.service so the route can map them to HTTP statuses.
    if (
      err.code === 'ECONNREFUSED' ||
      err.code === 'ENOTFOUND' ||
      err.timeout
    ) {
      const error = new Error(
        'The AI service might not be accessible from the outside.'
      );
      error.isUnreachable = true;
      throw error;
    }

    if (err.response && err.response.statusCode === 401) {
      const error = new Error(
        'AI service authentication failed. Please check the API key configuration.'
      );
      error.isAuthError = true;
      throw error;
    }

    if (err.response && err.response.statusCode === 429) {
      const error = new Error(
        'AI service rate limit exceeded. Please try again later.'
      );
      error.isRateLimit = true;
      throw error;
    }

    console.error('AI assistant error:', err.message);
    throw new Error(
      'Failed to get an answer from the AI assistant. Please try again later.'
    );
  }
};

module.exports = {
  askAssistant,
  // exported for unit testing
  buildSearchQuery,
  detectTypes,
  buildContextBlock,
  sanitizeHistory,
  toReferences,
  MAX_CONTEXT_RESULTS,
  MAX_HISTORY_MESSAGES,
};

