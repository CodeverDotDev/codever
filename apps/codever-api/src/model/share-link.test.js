const ShareLink = require('./share-link');

describe('ShareLink schema', () => {
  test('keeps tokens out of queries by default and makes them immutable', () => {
    const tokenPath = ShareLink.schema.path('token');

    expect(tokenPath.options.select).toBe(false);
    expect(tokenPath.options.immutable).toBe(true);
    expect(tokenPath.isRequired).toBe(true);
  });

  test('enforces unique tokens and one active link per resource', () => {
    const indexes = ShareLink.schema.indexes();
    const tokenIndex = indexes.find(([fields]) => fields.token === 1);
    const resourceIndex = indexes.find(
      ([fields]) => fields.resourceType === 1 && fields.resourceId === 1
    );

    expect(tokenIndex[1]).toMatchObject({ unique: true });
    expect(resourceIndex[1]).toMatchObject({
      unique: true,
      partialFilterExpression: { active: true },
    });
  });

  test('limits link resource types to bookmarks and notes', () => {
    const resourceTypePath = ShareLink.schema.path('resourceType');

    expect(resourceTypePath.enumValues).toEqual(['bookmark', 'note']);
  });
});
