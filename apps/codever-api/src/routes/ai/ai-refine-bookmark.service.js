const request = require('superagent');
const cheerio = require('cheerio');
const HttpStatus = require('http-status-codes/index');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat'; // DeepSeek V4 Flash

/**
 * Call the DeepSeek API to refine a bookmark's name, description, and tags.
 *
 * Strategy:
 * - Try to scrape the URL first to get page content
 * - If reachable: send the page content to DeepSeek for summarization + tag/title suggestions
 * - If unreachable: send the existing form data for refinement (grammar/clarity)
 *
 * @param {string} userId
 * @param {object} bookmarkData
 * @param {string} bookmarkData.name - Current bookmark name
 * @param {string} bookmarkData.location - The URL
 * @param {string[]} bookmarkData.tags - Current tags
 * @param {string} [bookmarkData.description] - Current description
 * @param {string} [bookmarkData.customPrompt] - Optional custom instructions
 * @returns {Promise<{refinedName: string, suggestedTags: string[], refinedDescription: string, pageReachable: boolean}>}
 */
const refineBookmark = async function (userId, bookmarkData) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }

  // --- Step 1: Try to scrape the URL ---
  let pageContent = null;
  let pageReachable = false;

  try {
    const scrapeResponse = await request
      .get(bookmarkData.location)
      .timeout(8000);

    if (scrapeResponse.statusCode === HttpStatus.OK) {
      const $ = cheerio.load(scrapeResponse.text);

      // Remove script/style tags before extracting text
      $('script, style, noscript').remove();

      const pageTitle = $('title').text().trim();
      const metaDescription = $('meta[name=description]').attr('content') || '';

      // Get readable text from body, limited to ~8000 chars for the AI prompt
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      const truncatedBody = bodyText.substring(0, 8000);

      pageContent = {
        title: pageTitle,
        metaDescription: metaDescription,
        bodyText: truncatedBody,
      };
      pageReachable = true;
    }
  } catch (scrapeErr) {
    // Site not reachable — we'll fall back to refinement mode
    pageReachable = false;
  }

  // --- Step 2: Build the AI prompt ---
  let systemPrompt;
  let userMessage;

  const OUTPUT_FORMAT = `

Return ONLY a valid JSON object (no markdown fences, no extra text) with exactly these keys:
- "refinedName": the improved bookmark name/title
- "suggestedTags": an array of suggested tag strings (lowercase, hyphenated, max 8)
- "refinedDescription": a polished markdown description summarizing the content`;

  if (pageReachable && pageContent) {
    // Summarization mode: send page content to AI
    const DEFAULT_SUMMARY_INSTRUCTIONS = `You are a helpful assistant that analyzes web page content and creates bookmark metadata.
Given the scraped content of a web page, you should:
1. Create a concise, descriptive bookmark name based on the page title and content.
2. Suggest relevant tags (lowercase, hyphenated for multi-word, max 8 tags) that categorize the page's topic.
3. Write a helpful markdown description (2-4 sentences) summarizing what the page is about.`;

    const instructions =
      bookmarkData.customPrompt || DEFAULT_SUMMARY_INSTRUCTIONS;
    systemPrompt = instructions + OUTPUT_FORMAT;

    const currentTags = (bookmarkData.tags || []).join(', ');
    userMessage = `URL: ${bookmarkData.location}
Page Title: ${pageContent.title}
Meta Description: ${pageContent.metaDescription || '(none)'}
Current Tags: ${currentTags || '(none)'}
Current Name: ${bookmarkData.name || '(empty)'}

Page Content:
${pageContent.bodyText}`;
  } else {
    // Refinement mode: polish existing data
    const DEFAULT_REFINE_INSTRUCTIONS = `You are a helpful assistant that refines bookmark metadata.
The URL could not be reached for scraping, so please refine the existing fields:
1. Polish the bookmark name for clarity and correctness.
2. Suggest relevant tags (lowercase, hyphenated for multi-word, max 8 tags).
3. Polish the description for grammar, clarity, and structure while preserving the original meaning and markdown formatting.`;

    const instructions =
      bookmarkData.customPrompt || DEFAULT_REFINE_INSTRUCTIONS;
    systemPrompt = instructions + OUTPUT_FORMAT;

    const currentTags = (bookmarkData.tags || []).join(', ');
    userMessage = `URL: ${bookmarkData.location} (not reachable for scraping)
Current Name: ${bookmarkData.name || '(empty)'}
Current Tags: ${currentTags || '(none)'}
Current Description: ${bookmarkData.description || '(empty)'}`;
  }

  // --- Step 3: Call DeepSeek API ---
  try {
    const response = await request
      .post(DEEPSEEK_API_URL)
      .set('Authorization', `Bearer ${apiKey}`)
      .set('Content-Type', 'application/json')
      .timeout(60000) // 60s — summarization may take longer
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
      const result = JSON.parse(aiResponse);
      result.pageReachable = pageReachable;
      return result;
    } else {
      throw new Error(
        `DeepSeek API returned unexpected status: ${response.statusCode}`
      );
    }
  } catch (err) {
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
    console.error('DeepSeek API error (bookmark):', err.message);
    throw new Error(
      'Failed to refine bookmark with AI. Please try again later.'
    );
  }
};

module.exports = {
  refineBookmark,
};
