const aiRefineService = require('./ai-refine.service');

// Mock superagent
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

const request = require('superagent');

describe('ai-refine.service', () => {
  const validPayload = {
    title: 'My Note',
    content: 'Some markdown content',
    tags: ['javascript', 'tutorial'],
    reference: 'https://example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set a mock API key
    process.env.DEEPSEEK_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
  });

  test('throws when DEEPSEEK_API_KEY is not configured', async () => {
    delete process.env.DEEPSEEK_API_KEY;

    await expect(
      aiRefineService.refineNoteContent('user-123', validPayload)
    ).rejects.toThrow('DEEPSEEK_API_KEY is not configured');
  });

  test('returns refined content on successful API response', async () => {
    const mockResponse = {
      statusCode: 200,
      body: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                refinedContent: 'Polished content',
                suggestedTags: ['javascript', 'guide'],
                suggestedTitle: 'Better Title',
              }),
            },
          },
        ],
      },
    };

    request.post().send.mockResolvedValue(mockResponse);

    const result = await aiRefineService.refineNoteContent(
      'user-123',
      validPayload
    );

    expect(result).toEqual({
      refinedContent: 'Polished content',
      suggestedTags: ['javascript', 'guide'],
      suggestedTitle: 'Better Title',
    });

    // Verify the API call was made correctly
    expect(request.post).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions'
    );
    expect(request.post().set).toHaveBeenCalledWith(
      'Authorization',
      'Bearer test-api-key'
    );
    expect(request.post().send).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'deepseek-chat',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        response_format: { type: 'json_object' },
      })
    );
  });

  test('handles empty content gracefully', async () => {
    const mockResponse = {
      statusCode: 200,
      body: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                refinedContent: '',
                suggestedTags: [],
                suggestedTitle: 'Untitled',
              }),
            },
          },
        ],
      },
    };

    request.post().send.mockResolvedValue(mockResponse);

    const result = await aiRefineService.refineNoteContent('user-123', {
      title: '',
      content: '',
      tags: [],
    });

    expect(result).toEqual({
      refinedContent: '',
      suggestedTags: [],
      suggestedTitle: 'Untitled',
    });
  });

  test('throws unreachable error on network failure', async () => {
    const networkError = new Error('connect ECONNREFUSED');
    networkError.code = 'ECONNREFUSED';
    request.post().send.mockRejectedValue(networkError);

    await expect(
      aiRefineService.refineNoteContent('user-123', validPayload)
    ).rejects.toThrow(
      'The AI service might not be accessible from the outside.'
    );
  });

  test('throws unreachable error on DNS failure', async () => {
    const dnsError = new Error('getaddrinfo ENOTFOUND');
    dnsError.code = 'ENOTFOUND';
    request.post().send.mockRejectedValue(dnsError);

    await expect(
      aiRefineService.refineNoteContent('user-123', validPayload)
    ).rejects.toThrow(
      'The AI service might not be accessible from the outside.'
    );
  });

  test('throws auth error on 401 response', async () => {
    const authError = new Error('Unauthorized');
    authError.response = { statusCode: 401 };
    request.post().send.mockRejectedValue(authError);

    await expect(
      aiRefineService.refineNoteContent('user-123', validPayload)
    ).rejects.toThrow(
      'AI service authentication failed. Please check the API key configuration.'
    );
  });

  test('throws rate limit error on 429 response', async () => {
    const rateLimitError = new Error('Too Many Requests');
    rateLimitError.response = { statusCode: 429 };
    request.post().send.mockRejectedValue(rateLimitError);

    await expect(
      aiRefineService.refineNoteContent('user-123', validPayload)
    ).rejects.toThrow(
      'AI service rate limit exceeded. Please try again later.'
    );
  });

  test('throws generic error on unexpected failure', async () => {
    const unexpectedError = new Error('Something went wrong');
    request.post().send.mockRejectedValue(unexpectedError);

    await expect(
      aiRefineService.refineNoteContent('user-123', validPayload)
    ).rejects.toThrow(
      'Failed to refine note with AI. Please try again later.'
    );
  });

  test('includes reference URL in prompt when provided', async () => {
    const mockResponse = {
      statusCode: 200,
      body: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                refinedContent: 'test',
                suggestedTags: [],
                suggestedTitle: 'test',
              }),
            },
          },
        ],
      },
    };

    request.post().send.mockResolvedValue(mockResponse);

    await aiRefineService.refineNoteContent('user-123', validPayload);

    const sendArg = request.post().send.mock.calls[0][0];
    const userMessage = sendArg.messages.find(
      (m) => m.role === 'user'
    ).content;
    expect(userMessage).toContain('https://example.com');
  });

  test('omits reference URL from prompt when not provided', async () => {
    const mockResponse = {
      statusCode: 200,
      body: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                refinedContent: 'test',
                suggestedTags: [],
                suggestedTitle: 'test',
              }),
            },
          },
        ],
      },
    };

    request.post().send.mockResolvedValue(mockResponse);

    await aiRefineService.refineNoteContent('user-123', {
      title: 'Test',
      content: 'test',
      tags: [],
    });

    const sendArg = request.post().send.mock.calls[0][0];
    const userMessage = sendArg.messages.find(
      (m) => m.role === 'user'
    ).content;
    expect(userMessage).not.toContain('Reference URL');
  });
});
