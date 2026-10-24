jest.mock('../../model/bookmark', () => ({ findOne: jest.fn() }));
jest.mock('../../model/note', () => ({ findOne: jest.fn() }));
jest.mock('../../model/share-link', () => {
  const ShareLink = jest.fn();
  ShareLink.findOne = jest.fn();
  ShareLink.findOneAndUpdate = jest.fn();
  ShareLink.updateMany = jest.fn();
  return ShareLink;
});

const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const ShareLink = require('../../model/share-link');
const ValidationError = require('../../error/validation.error');
const NotFoundError = require('../../error/not-found.error');
const ShareLinkConflictError = require('../../error/share-link-conflict.error');
const service = require('./share-link.service');

const RESOURCE_ID = '64b000000000000000000001';
const LINK_ID = '64b000000000000000000002';
const activeLink = (overrides = {}) => ({
  _id: LINK_ID,
  resourceType: 'note',
  resourceId: RESOURCE_ID,
  ownerUserId: 'owner',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  token: 'share-token',
  active: true,
  ...overrides,
});

let findActive;

beforeEach(() => {
  jest.clearAllMocks();
  Bookmark.findOne.mockResolvedValue({ _id: RESOURCE_ID, userId: 'owner' });
  Note.findOne.mockResolvedValue({ _id: RESOURCE_ID, userId: 'owner' });
  findActive = jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue(null),
  });
  ShareLink.findOne.mockImplementation(findActive);
  ShareLink.findOneAndUpdate.mockResolvedValue({ _id: LINK_ID });
  ShareLink.mockImplementation(function (data) {
    Object.assign(this, data, {
      _id: LINK_ID,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      save: jest.fn().mockImplementation(async () => this),
    });
  });
});

describe('getShareLinkStatus', () => {
  test('returns inactive without creating a link', async () => {
    await expect(
      service.getShareLinkStatus('owner', 'note', RESOURCE_ID)
    ).resolves.toEqual({ active: false });

    expect(ShareLink).not.toHaveBeenCalled();
    expect(Note.findOne).toHaveBeenCalledWith({
      _id: RESOURCE_ID,
      userId: 'owner',
    });
  });

  test('returns the existing link and selects its token explicitly', async () => {
    findActive.mockReturnValue({
      select: jest.fn().mockResolvedValue(activeLink()),
    });

    await expect(
      service.getShareLinkStatus('owner', 'note', RESOURCE_ID)
    ).resolves.toMatchObject({
      active: true,
      token: 'share-token',
      shareLinkId: LINK_ID,
    });
    expect(findActive.mock.results[0].value.select).toHaveBeenCalledWith(
      '+token'
    );
    expect(ShareLink).not.toHaveBeenCalled();
  });

  test('rejects invalid types and IDs before querying resources', async () => {
    await expect(
      service.getShareLinkStatus('owner', 'snippet', RESOURCE_ID)
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.getShareLinkStatus('owner', 'note', 'not-an-id')
    ).rejects.toBeInstanceOf(ValidationError);
    expect(Note.findOne).not.toHaveBeenCalled();
  });

  test('does not disclose a missing or foreign resource', async () => {
    Note.findOne.mockResolvedValue(null);

    await expect(
      service.getShareLinkStatus('owner', 'note', RESOURCE_ID)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(ShareLink.findOne).not.toHaveBeenCalled();
  });
});

describe('createShareLink', () => {
  test('creates a 256-bit token only on explicit creation', async () => {
    const result = await service.createShareLink(
      'owner',
      'note',
      RESOURCE_ID
    );

    expect(result).toMatchObject({
      active: true,
      token: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      created: true,
    });
    expect(Buffer.from(result.token, 'base64url')).toHaveLength(32);
    expect(ShareLink).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: 'owner',
        resourceType: 'note',
        active: true,
      })
    );
  });

  test('returns the existing link instead of rotating it', async () => {
    findActive.mockReturnValue({
      select: jest.fn().mockResolvedValue(activeLink()),
    });

    await expect(
      service.createShareLink('owner', 'note', RESOURCE_ID)
    ).resolves.toMatchObject({ token: 'share-token', created: false });
    expect(ShareLink).not.toHaveBeenCalled();
  });

  test('converges when another request inserts the resource link', async () => {
    const error = Object.assign(new Error('duplicate'), {
      code: 11000,
      keyPattern: { resourceType: 1, resourceId: 1 },
    });
    ShareLink.mockImplementationOnce(function (data) {
      Object.assign(this, data, { save: jest.fn().mockRejectedValue(error) });
    });
    findActive
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(activeLink()),
      });

    await expect(
      service.createShareLink('owner', 'note', RESOURCE_ID)
    ).resolves.toMatchObject({ token: 'share-token', created: false });
  });

  test('bounds token-collision retries without returning an unsaved token', async () => {
    const error = Object.assign(new Error('token_1 duplicate'), {
      code: 11000,
      keyPattern: { token: 1 },
    });
    ShareLink.mockImplementation(function (data) {
      Object.assign(this, data, { save: jest.fn().mockRejectedValue(error) });
    });

    await expect(
      service.createShareLink('owner', 'note', RESOURCE_ID)
    ).rejects.toBeInstanceOf(ShareLinkConflictError);
    expect(ShareLink).toHaveBeenCalledTimes(3);
  });
});

describe('revokeShareLink', () => {
  test('revokes an owned link atomically', async () => {
    findActive.mockResolvedValue(activeLink());

    await service.revokeShareLink('owner', LINK_ID);

    expect(ShareLink.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: LINK_ID, ownerUserId: 'owner', active: true },
      expect.objectContaining({
        $set: expect.objectContaining({ active: false }),
      }),
      { new: true }
    );
  });

  describe('resource deletion cleanup', () => {
    test('revokes all active links for deleted resources', async () => {
      ShareLink.updateMany.mockResolvedValue({ modifiedCount: 1 });
      const resourceIds = [RESOURCE_ID];

      await service.revokeDeletedResourceLinks('bookmark', resourceIds);

      expect(ShareLink.updateMany).toHaveBeenCalledWith(
        {
          resourceType: 'bookmark',
          resourceId: { $in: resourceIds },
          active: true,
        },
        {
          $set: { active: false, revokedAt: expect.any(Date) },
        }
      );
    });

    describe('anonymous resource resolution', () => {
      test('resolves a private resource only through an active matching link', async () => {
        const link = {
          resourceId: RESOURCE_ID,
          ownerUserId: 'owner',
        };
        const resource = { _id: RESOURCE_ID, userId: 'owner', public: false };
        ShareLink.findOne.mockResolvedValue(link);
        Note.findOne.mockResolvedValue(resource);

        await expect(
          service.resolveSharedResource('note', 'A'.repeat(43))
        ).resolves.toBe(resource);
        expect(ShareLink.findOne).toHaveBeenCalledWith({
          resourceType: 'note',
          token: 'A'.repeat(43),
          active: true,
        });
        expect(Note.findOne).toHaveBeenCalledWith({
          _id: RESOURCE_ID,
          userId: 'owner',
        });
      });

      test.each([
        ['invalid type', 'snippet', 'A'.repeat(43)],
        ['malformed token', 'note', 'legacy-token'],
      ])('returns the same not-found for %s', async (_case, type, token) => {
        await expect(
          service.resolveSharedResource(type, token)
        ).rejects.toMatchObject({ name: 'NotFoundError', message: 'Shared resource not found' });
        expect(ShareLink.findOne).not.toHaveBeenCalled();
      });

      test('does not resolve missing, revoked, or dangling link records', async () => {
        ShareLink.findOne.mockResolvedValue(null);
        await expect(
          service.resolveSharedResource('note', 'A'.repeat(43))
        ).rejects.toMatchObject({ message: 'Shared resource not found' });

        ShareLink.findOne.mockResolvedValue({
          resourceId: RESOURCE_ID,
          ownerUserId: 'owner',
        });
        Note.findOne.mockResolvedValue(null);
        await expect(
          service.resolveSharedResource('note', 'A'.repeat(43))
        ).rejects.toMatchObject({ message: 'Shared resource not found' });
      });
    });

    test('does not issue an update when no resources were deleted', async () => {
      await service.revokeDeletedResourceLinks('note', []);

      expect(ShareLink.updateMany).not.toHaveBeenCalled();
    });

    test('does not cast invalid identifiers during post-delete cleanup', async () => {
      await service.revokeDeletedResourceLinks('bookmark', ['bookmark-1']);

      expect(ShareLink.updateMany).not.toHaveBeenCalled();
    });
  });

  test('is idempotent for an already revoked link', async () => {
    findActive.mockResolvedValue(activeLink({ active: false }));

    await expect(service.revokeShareLink('owner', LINK_ID)).resolves.toBeUndefined();
    expect(ShareLink.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('does not disclose a foreign or missing link', async () => {
    findActive.mockResolvedValue(null);

    await expect(service.revokeShareLink('owner', LINK_ID)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(ShareLink.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
