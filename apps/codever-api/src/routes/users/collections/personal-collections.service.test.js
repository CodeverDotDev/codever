const PersonalCollectionsService = require('./personal-collections.service');
const Collection = require('../../../model/collection');
const Bookmark = require('../../../model/bookmark');
const Note = require('../../../model/note');
const NotFoundError = require('../../../error/not-found.error');
const ValidationError = require('../../../error/validation.error');

jest.mock('../../../model/collection');
jest.mock('../../../model/bookmark');
jest.mock('../../../model/note');

describe('PersonalCollectionsService', () => {
  const userId = 'test-user-id';

  afterEach(() => jest.restoreAllMocks());

  describe('createCollection', () => {
    it('should throw ValidationError when name is empty', async () => {
      await expect(
        PersonalCollectionsService.createCollection(userId, { name: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when name is missing', async () => {
      await expect(
        PersonalCollectionsService.createCollection(userId, {})
      ).rejects.toThrow(ValidationError);
    });

    it('should create a collection with correct fields', async () => {
      const mockSave = jest.fn().mockResolvedValue({
        _id: 'col-1',
        name: 'My Collection',
        userId,
        items: [],
        public: false,
      });
      Collection.mockImplementation(() => ({ save: mockSave }));

      const result = await PersonalCollectionsService.createCollection(userId, {
        name: 'My Collection',
        description: 'Test description',
        color: '#ff0000',
      });

      expect(result.name).toBe('My Collection');
      expect(result.public).toBe(false);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should trim the collection name', async () => {
      const mockSave = jest.fn().mockResolvedValue({
        _id: 'col-1',
        name: 'Trimmed',
        userId,
        items: [],
      });
      Collection.mockImplementation(function (data) {
        this.name = data.name;
        this.save = mockSave;
      });

      await PersonalCollectionsService.createCollection(userId, {
        name: '  Trimmed  ',
      });

      expect(Collection).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Trimmed' })
      );
    });
  });

  describe('getUserCollections', () => {
    it('should query with userId and pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      Collection.find = jest.fn().mockReturnValue({ sort: mockSort });

      await PersonalCollectionsService.getUserCollections(userId, null, 1, 20);

      expect(Collection.find).toHaveBeenCalledWith({ userId });
      expect(mockSort).toHaveBeenCalledWith({ updatedAt: -1 });
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('should add name regex filter when searchText is provided', async () => {
      const mockLean = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      Collection.find = jest.fn().mockReturnValue({ sort: mockSort });

      await PersonalCollectionsService.getUserCollections(
        userId,
        'spring',
        1,
        20
      );

      expect(Collection.find).toHaveBeenCalledWith({
        userId,
        name: { $regex: 'spring', $options: 'i' },
      });
    });
  });

  describe('getCollectionById', () => {
    it('should throw NotFoundError when collection does not exist', async () => {
      Collection.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        PersonalCollectionsService.getCollectionById(userId, 'non-existent')
      ).rejects.toThrow(NotFoundError);
    });

    it('should update lastVisitedAt and return collection with populatedItems', async () => {
      const mockCollection = {
        _id: 'col-1',
        name: 'Test',
        lastVisitedAt: null,
        items: [
          { resourceId: 'bm-1', resourceType: 'bookmark' },
          { resourceId: 'nt-1', resourceType: 'note' },
        ],
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'col-1',
          name: 'Test',
          items: [
            { resourceId: 'bm-1', resourceType: 'bookmark' },
            { resourceId: 'nt-1', resourceType: 'note' },
          ],
        }),
      };
      Collection.findOne = jest.fn().mockResolvedValue(mockCollection);

      const mockBookmark = { _id: 'bm-1', name: 'Test Bookmark' };
      const mockNote = { _id: 'nt-1', title: 'Test Note' };
      Bookmark.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([mockBookmark]) });
      Note.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([mockNote]) });

      const result = await PersonalCollectionsService.getCollectionById(
        userId,
        'col-1'
      );

      expect(mockCollection.save).toHaveBeenCalled();
      expect(result.populatedItems).toHaveLength(2);
      expect(result.populatedItems[0].resource).toEqual(mockBookmark);
      expect(result.populatedItems[1].resource).toEqual(mockNote);
    });
  });

  describe('updateCollection', () => {
    it('should throw ValidationError when name is empty', async () => {
      await expect(
        PersonalCollectionsService.updateCollection(userId, 'col-1', {
          name: '   ',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when collection does not exist', async () => {
      Collection.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(
        PersonalCollectionsService.updateCollection(userId, 'non-existent', {
          name: 'Updated',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should update and return the collection', async () => {
      const updatedDoc = { _id: 'col-1', name: 'Updated', userId };
      Collection.findOneAndUpdate = jest.fn().mockResolvedValue(updatedDoc);

      const result = await PersonalCollectionsService.updateCollection(
        userId,
        'col-1',
        { name: 'Updated', description: 'New desc' }
      );

      expect(result.name).toBe('Updated');
      expect(Collection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'col-1', userId },
        {
          $set: {
            name: 'Updated',
            description: 'New desc',
            color: undefined,
          },
        },
        { new: true }
      );
    });
  });

  describe('deleteCollectionById', () => {
    it('should throw NotFoundError when collection does not exist', async () => {
      Collection.findOneAndDelete = jest.fn().mockResolvedValue(null);

      await expect(
        PersonalCollectionsService.deleteCollectionById(userId, 'non-existent')
      ).rejects.toThrow(NotFoundError);
    });

    it('should delete the collection', async () => {
      Collection.findOneAndDelete = jest
        .fn()
        .mockResolvedValue({ _id: 'col-1' });

      await expect(
        PersonalCollectionsService.deleteCollectionById(userId, 'col-1')
      ).resolves.toBeUndefined();
    });
  });

  describe('addItemToCollection', () => {
    it('should throw ValidationError for invalid resourceType', async () => {
      await expect(
        PersonalCollectionsService.addItemToCollection(
          userId,
          'col-1',
          'res-1',
          'invalid'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when collection does not exist', async () => {
      Collection.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        PersonalCollectionsService.addItemToCollection(
          userId,
          'col-1',
          'res-1',
          'bookmark'
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should not duplicate an item already in the collection', async () => {
      const mockCollection = {
        items: [
          {
            resourceId: { toString: () => 'res-1' },
            resourceType: 'bookmark',
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };
      Collection.findOne = jest.fn().mockResolvedValue(mockCollection);

      const result = await PersonalCollectionsService.addItemToCollection(
        userId,
        'col-1',
        'res-1',
        'bookmark'
      );

      expect(mockCollection.save).not.toHaveBeenCalled();
      expect(result).toBe(mockCollection);
    });

    it('should add a new item to the collection', async () => {
      const mockCollection = {
        items: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      // Bind save to mockCollection
      mockCollection.save = jest.fn().mockResolvedValue(mockCollection);
      Collection.findOne = jest.fn().mockResolvedValue(mockCollection);

      await PersonalCollectionsService.addItemToCollection(
        userId,
        'col-1',
        'res-1',
        'note'
      );

      expect(mockCollection.items).toHaveLength(1);
      expect(mockCollection.items[0].resourceId).toBe('res-1');
      expect(mockCollection.items[0].resourceType).toBe('note');
      expect(mockCollection.save).toHaveBeenCalled();
    });
  });

  describe('removeItemFromCollection', () => {
    it('should throw NotFoundError when collection does not exist', async () => {
      Collection.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(
        PersonalCollectionsService.removeItemFromCollection(
          userId,
          'col-1',
          'res-1'
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should remove the item and return the updated collection', async () => {
      const updatedDoc = { _id: 'col-1', items: [] };
      Collection.findOneAndUpdate = jest.fn().mockResolvedValue(updatedDoc);

      const result = await PersonalCollectionsService.removeItemFromCollection(
        userId,
        'col-1',
        'res-1'
      );

      expect(result.items).toHaveLength(0);
      expect(Collection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'col-1', userId },
        { $pull: { items: { resourceId: 'res-1' } } },
        { new: true }
      );
    });
  });

  describe('getCollectionsContainingResource', () => {
    it('should return collections containing the given resource', async () => {
      const mockSelect = jest.fn().mockResolvedValue([
        { _id: 'col-1', name: 'Collection A', color: '#ff0000' },
      ]);
      Collection.find = jest.fn().mockReturnValue({ select: mockSelect });

      const result =
        await PersonalCollectionsService.getCollectionsContainingResource(
          userId,
          'res-1'
        );

      expect(result).toHaveLength(1);
      expect(Collection.find).toHaveBeenCalledWith({
        userId,
        'items.resourceId': 'res-1',
      });
    });
  });
});

