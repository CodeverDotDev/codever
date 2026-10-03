jest.mock('superagent', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
const request = require('superagent');
const { refineBookmark } = require('./ai-refine-bookmark.service');

describe.each([true, false])('bookmark refinement, pageReachable=%s', (pageReachable) => {
  let send;
  let originalKey;
  beforeEach(() => {
    originalKey = process.env.DEEPSEEK_API_KEY;
    process.env.DEEPSEEK_API_KEY = 'test-key';
    const timeout = pageReachable
      ? jest.fn().mockResolvedValue({ statusCode: 200, text: '<html><title>Page</title><body>Text</body></html>' })
      : jest.fn().mockRejectedValue(new Error('unreachable'));
    request.get.mockReturnValue({ timeout });
    send = jest.fn();
    request.post.mockReturnValue({ set: jest.fn().mockReturnThis(), timeout: jest.fn().mockReturnThis(), send });
  });
  afterEach(() => {
    if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = originalKey;
    jest.clearAllMocks();
  });

  describe.each([undefined, 'Improve clarity only.'])('customPrompt=%s', (customPrompt) => {
    test.each([9, 10, 13])('recommends eight, allows thirteen, and preserves %i tags', async (count) => {
      const tags = Array.from({ length: count }, (_, i) => `tag-${i}`);
      send.mockResolvedValue({
        statusCode: 200,
        body: { choices: [{ message: { content: JSON.stringify({
          refinedName: 'Page', refinedDescription: 'Text', suggestedTags: tags,
        }) } }] },
      });
      const result = await refineBookmark('owner', {
        name: 'Page', location: 'https://example.com', description: 'Text', tags, customPrompt,
      });
      const { messages } = send.mock.calls[0][0];
      expect(messages[0].content).toContain('at most 8');
      expect(messages[0].content).toContain('hard ceiling is 13');
      expect(messages[0].content).toContain('Do not remove existing tags');
      expect(messages[0].content).not.toContain('max 8');
      if (customPrompt) expect(messages[0].content).toContain(customPrompt);
      expect(messages[1].content).toContain(tags.join(', '));
      expect(result.suggestedTags).toEqual(tags);
      expect(result.pageReachable).toBe(pageReachable);
    });
  });
});
