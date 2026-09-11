const assistantService = require('./assistant.service');

// Mock superagent (same chain shape as ai-refine.service.test.js)
jest.mock('superagent', () => {
  const mockRequest = {
    set: jest.fn().mockReturnThis(),
    timeout: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };
  return {
    post: jest.fn(() => mockRequest),
  };
});

// Mock the read-only retrieval layer so the service is tested in isolation.
jest.mock('../../mcp/mcp-tools.service', () => ({
  searchEntries: jest.fn(),
}));

const request = require('superagent');
const mcpToolsService = require('../../mcp/mcp-tools.service');

const sampleResults = [
  {
    type: 'note',
    id: 'note-1',
    title: 'Undo last git commit',
    tags: ['git'],
    excerpt: 'Use git reset --soft HEAD~1 to undo the last commit.',
  },
  {
    type: 'bookmark',
    id: 'bm-1',
    title: 'Git docs',
    url: 'https://git-scm.com',
    tags: ['git', 'docs'],
    excerpt: 'Official git documentation.',
  },
];

function mockDeepSeekAnswer(answer) {
  request.post().send.mockResolvedValue({
    statusCode: 200,
    body: { choices: [{ message: { content: answer } }] },
  });
}

describe('assistant.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DEEPSEEK_API_KEY = 'test-api-key';
    mcpToolsService.searchEntries.mockResolvedValue({ results: sampleResults });
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
  });

  test('throws when DEEPSEEK_API_KEY is not configured', async () => {
    delete process.env.DEEPSEEK_API_KEY;

    await expect(
      assistantService.askAssistant('user-123', { message: 'how to undo a commit?' })
    ).rejects.toThrow('DEEPSEEK_API_KEY is not configured');
  });

  test('retrieves the user\'s own entries scoped by userId', async () => {
    mockDeepSeekAnswer('Use git reset.');

    await assistantService.askAssistant('user-123', {
      message: 'how to undo a commit?',
    });

    expect(mcpToolsService.searchEntries).toHaveBeenCalledWith('user-123', {
      text: 'undo commit',
      limit: assistantService.MAX_CONTEXT_RESULTS,
      searchInclude: 'any',
    });
  });

  test('returns answer plus structured references', async () => {
    mockDeepSeekAnswer('You can run `git reset --soft HEAD~1`.');

    const result = await assistantService.askAssistant('user-123', {
      message: 'how to undo a commit?',
    });

    expect(result.answer).toBe('You can run `git reset --soft HEAD~1`.');
    expect(result.references).toEqual([
      {
        type: 'note',
        id: 'note-1',
        title: 'Undo last git commit',
        url: undefined,
        excerpt: 'Use git reset --soft HEAD~1 to undo the last commit.',
      },
      {
        type: 'bookmark',
        id: 'bm-1',
        title: 'Git docs',
        url: 'https://git-scm.com',
        excerpt: 'Official git documentation.',
      },
    ]);
  });

  test('sends system + user messages including the retrieved context', async () => {
    mockDeepSeekAnswer('answer');

    await assistantService.askAssistant('user-123', {
      message: 'how to undo a commit?',
    });

    const sendArg = request.post().send.mock.calls[0][0];
    expect(sendArg.model).toBe('deepseek-chat');
    const roles = sendArg.messages.map((m) => m.role);
    expect(roles[0]).toBe('system');
    expect(roles[roles.length - 1]).toBe('user');
    const userMessage = sendArg.messages[sendArg.messages.length - 1].content;
    expect(userMessage).toContain('Undo last git commit');
    expect(userMessage).toContain('how to undo a commit?');
  });

  test('includes sanitized, bounded history between system and user messages', async () => {
    mockDeepSeekAnswer('answer');

    const history = [
      { role: 'user', content: 'previous question' },
      { role: 'assistant', content: 'previous answer' },
      { role: 'system', content: 'malicious system injection' }, // dropped
      { role: 'user', content: '' }, // dropped (empty)
    ];

    await assistantService.askAssistant('user-123', {
      message: 'follow up',
      history,
    });

    const sendArg = request.post().send.mock.calls[0][0];
    const middle = sendArg.messages.slice(1, -1);
    expect(middle).toEqual([
      { role: 'user', content: 'previous question' },
      { role: 'assistant', content: 'previous answer' },
    ]);
  });

  test('handles empty retrieval gracefully', async () => {
    mcpToolsService.searchEntries.mockResolvedValue({ results: [] });
    mockDeepSeekAnswer("I couldn't find anything relevant.");

    const result = await assistantService.askAssistant('user-123', {
      message: 'obscure question',
    });

    expect(result.references).toEqual([]);
    const sendArg = request.post().send.mock.calls[0][0];
    const userMessage = sendArg.messages[sendArg.messages.length - 1].content;
    expect(userMessage).toContain('no matching bookmarks or notes');
  });

  test('throws unreachable error on network failure', async () => {
    const networkError = new Error('connect ECONNREFUSED');
    networkError.code = 'ECONNREFUSED';
    request.post().send.mockRejectedValue(networkError);

    await expect(
      assistantService.askAssistant('user-123', { message: 'q' })
    ).rejects.toThrow('The AI service might not be accessible from the outside.');
  });

  test('throws auth error on 401 response', async () => {
    const authError = new Error('Unauthorized');
    authError.response = { statusCode: 401 };
    request.post().send.mockRejectedValue(authError);

    await expect(
      assistantService.askAssistant('user-123', { message: 'q' })
    ).rejects.toThrow('AI service authentication failed');
  });

  test('throws rate limit error on 429 response', async () => {
    const rateLimitError = new Error('Too Many Requests');
    rateLimitError.response = { statusCode: 429 };
    request.post().send.mockRejectedValue(rateLimitError);

    await expect(
      assistantService.askAssistant('user-123', { message: 'q' })
    ).rejects.toThrow('AI service rate limit exceeded');
  });

  test('throws generic error on unexpected failure', async () => {
    request.post().send.mockRejectedValue(new Error('boom'));

    await expect(
      assistantService.askAssistant('user-123', { message: 'q' })
    ).rejects.toThrow('Failed to get an answer from the AI assistant');
  });
});


describe('assistant.service buildSearchQuery', () => {
  test('drops filler words and quotes so a tag term survives', () => {
    expect(
      assistantService.buildSearchQuery('Find bookmarks tagged "emoji"')
    ).toBe('emoji');
  });

  test('reduces a question to its meaningful terms', () => {
    expect(
      assistantService.buildSearchQuery('What did I bookmark about git?')
    ).toBe('git');
  });

  test('falls back to the raw message when everything is stripped', () => {
    expect(assistantService.buildSearchQuery('show my bookmarks')).toBe(
      'show my bookmarks'
    );
  });
});

describe('assistant.service detectTypes', () => {
  test('restricts to notes when the user asks about notes', () => {
    expect(assistantService.detectTypes('summarize my notes on Tennis')).toEqual(
      ['note']
    );
  });

  test('treats snippets as notes', () => {
    expect(assistantService.detectTypes('find my snippet about regex')).toEqual([
      'note',
    ]);
  });

  test('restricts to bookmarks when the user asks about bookmarks', () => {
    expect(
      assistantService.detectTypes('what bookmarks do I have on Tennis?')
    ).toEqual(['bookmark']);
  });

  test('returns undefined (both) when both types are mentioned', () => {
    expect(
      assistantService.detectTypes('show my bookmarks and notes on Tennis')
    ).toBeUndefined();
  });

  test('returns undefined (both) when neither type is mentioned', () => {
    expect(assistantService.detectTypes('anything about Tennis?')).toBeUndefined();
  });

  test('does not match "note" inside a larger word', () => {
    expect(assistantService.detectTypes('notable things')).toBeUndefined();
  });
});

describe('assistant.service type-scoped retrieval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DEEPSEEK_API_KEY = 'test-api-key';
    mcpToolsService.searchEntries.mockResolvedValue({ results: sampleResults });
    mockDeepSeekAnswer('answer');
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
  });

  test('passes types:["note"] when the user asks to summarize their notes', async () => {
    await assistantService.askAssistant('user-123', {
      message: 'summarize my notes on Tennis',
    });

    expect(mcpToolsService.searchEntries).toHaveBeenCalledWith('user-123', {
      text: 'tennis',
      types: ['note'],
      limit: assistantService.MAX_CONTEXT_RESULTS,
      searchInclude: 'any',
    });
  });

  test('passes types:["bookmark"] when the user asks about their bookmarks', async () => {
    await assistantService.askAssistant('user-123', {
      message: 'what bookmarks do I have on Tennis?',
    });

    expect(mcpToolsService.searchEntries).toHaveBeenCalledWith('user-123', {
      text: 'tennis',
      types: ['bookmark'],
      limit: assistantService.MAX_CONTEXT_RESULTS,
      searchInclude: 'any',
    });
  });
});

