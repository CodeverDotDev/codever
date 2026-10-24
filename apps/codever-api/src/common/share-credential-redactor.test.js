const redactShareCredentials = require('./share-credential-redactor');

describe('share credential redaction', () => {
  test.each([
    '/api/public/bookmarks/shared/current-token',
    '/api/public/notes/shared/legacy-token',
    '/bookmarks/shared/current-token',
    '/public/notes/shared/legacy-token',
    '/snippets/shared/legacy-token',
    '/api/personal/users/owner/bookmarks/shareable/resource-id',
  ])('redacts bearer paths in %s', (value) => {
    expect(redactShareCredentials(value)).not.toMatch(
      /current-token|legacy-token|resource-id/
    );
    expect(redactShareCredentials(value)).toContain('[REDACTED]');
  });

  test('redacts URLs and Referer values without changing unrelated details', () => {
    const url = '/api/public/notes/shared/current-token?format=full';
    const referer = 'https://www.codever.dev/notes/shared/current-token';

    expect(redactShareCredentials(url)).toBe(
      '/api/public/notes/shared/[REDACTED]?format=full'
    );
    expect(redactShareCredentials(referer)).toBe(
      'https://www.codever.dev/notes/shared/[REDACTED]'
    );
    expect(redactShareCredentials('/api/public/bookmarks/id')).toBe(
      '/api/public/bookmarks/id'
    );
  });
});
