const request = require('superagent');
const HttpStatus = require('http-status-codes/index');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat'; // DeepSeek V4 Flash (fast/standard model)

/**
 * Call the DeepSeek API to refine a note's content, suggest tags, and
 * suggest a better title.
 *
 * @param {string} userId - The Keycloak user ID (for logging/audit)
 * @param {object} noteData
 * @param {string} noteData.title - Current note title
 * @param {string} noteData.content - Current note content (markdown)
 * @param {string[]} noteData.tags - Current tags
 * @param {string} [noteData.reference] - Optional reference URL
 * @param {string} [noteData.customPrompt] - Optional custom system prompt (overrides default)
 * @returns {Promise<{refinedContent: string, suggestedTags: string[], suggestedTitle: string}>}
 */
const refineNoteContent = async function (userId, noteData) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error(
      'DEEPSEEK_API_KEY is not configured. Please set it in the environment.'
    );
  }

  const DEFAULT_INSTRUCTIONS = `You are a helpful assistant that refines markdown notes.
Given a note's title, content, tags, and optional reference URL, you should:
1. Polish the content for grammar, clarity, and structure while preserving the original meaning and markdown formatting.
2. Suggest relevant tags (lowercase, hyphenated for multi-word, max 8 tags).
3. Suggest a better title if the current one could be improved.`;

  const OUTPUT_FORMAT_INSTRUCTIONS = `

Return ONLY a valid JSON object (no markdown fences, no extra text) with exactly these keys:
- "refinedContent": the polished markdown content
- "suggestedTags": an array of suggested tag strings
- "suggestedTitle": the improved title (or the original if it's already good)`;

  const instructions = noteData.customPrompt || DEFAULT_INSTRUCTIONS;
  const systemPrompt = instructions + OUTPUT_FORMAT_INSTRUCTIONS;

  const currentTags = (noteData.tags || []).join(', ');
  const referenceInfo = noteData.reference
    ? `\nReference URL: ${noteData.reference}`
    : '';

  const userMessage = `Title: ${noteData.title || '(empty)'}
    Current Tags: ${currentTags || '(none)'}${referenceInfo}

    Content:
    ${noteData.content || '(empty)'}`;

  try {
    const response = await request
      .post(DEEPSEEK_API_URL)
      .set('Authorization', `Bearer ${apiKey}`)
      .set('Content-Type', 'application/json')
      .timeout(30000) // 30 second timeout
      .send({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });

    if (response.statusCode === HttpStatus.OK) {
      const aiResponse = response.body.choices[0].message.content;
      return JSON.parse(aiResponse);
    } else {
      throw new Error(
        `DeepSeek API returned unexpected status: ${response.statusCode}`
      );
    }
  } catch (err) {
    // Distinguish between network errors (site unreachable) and API errors
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

    // Re-throw the original error with context
    console.error('DeepSeek API error:', err.message);
    throw new Error('Failed to refine note with AI. Please try again later.');
  }
};

module.exports = {
  refineNoteContent,
};
