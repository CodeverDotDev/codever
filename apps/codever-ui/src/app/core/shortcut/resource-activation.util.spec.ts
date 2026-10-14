import { Bookmark } from '../model/bookmark';
import { Note } from '../model/note';
import { PinnedCollection } from '../model/collection';
import { UserDataResource } from '../model/user-data-resource.type';
import {
  activationHintLabel,
  collectionDetailsRoute,
  noteDetailsRoute,
  singleVisibleResource,
} from './resource-activation.util';

describe('resource-activation util', () => {
  const bookmark = (id: string): Bookmark =>
    ({
      _id: id,
      name: `Bookmark ${id}`,
      location: `https://example.com/${id}`,
      type: 'bookmark',
      tags: [],
      userDisplayName: 'tester',
    } as Bookmark);

  const note = (id: string, isPublic = false): Note =>
    ({
      _id: id,
      title: `Note ${id}`,
      type: 'note',
      content: '',
      color: '',
      tags: [],
      public: isPublic,
    } as Note);

  const collection = (id: string): PinnedCollection =>
    ({ _id: id, name: `Collection ${id}`, type: 'collection' } as never);

  const ALL = ['bookmark', 'note', 'collection'] as const;

  describe('noteDetailsRoute', () => {
    it('uses the personal route for a private note', () => {
      expect(noteDetailsRoute(note('n'))).toEqual([
        '/my-notes',
        'n',
        'details',
      ]);
    });

    it('uses the public route for a public note', () => {
      expect(noteDetailsRoute(note('n', true))).toEqual([
        '/notes',
        'n',
        'details',
      ]);
    });
  });

  describe('collectionDetailsRoute', () => {
    it('routes to the collection details page', () => {
      expect(collectionDetailsRoute(collection('c'))).toEqual([
        '/my-collections',
        'c',
      ]);
    });
  });

  describe('singleVisibleResource', () => {
    it('returns the only result for each activatable type', () => {
      expect(singleVisibleResource([bookmark('b')], ALL)).toEqual(
        bookmark('b')
      );
      expect(singleVisibleResource([note('n')], ALL)).toEqual(note('n'));
      expect(singleVisibleResource([collection('c')], ALL)).toEqual(
        collection('c')
      );
    });

    it('returns null for zero results', () => {
      expect(singleVisibleResource([], ALL)).toBeNull();
      expect(singleVisibleResource(null, ALL)).toBeNull();
      expect(singleVisibleResource(undefined, ALL)).toBeNull();
    });

    it('returns null for multiple results, including a mixed pair', () => {
      expect(
        singleVisibleResource([bookmark('a'), bookmark('b')], ALL)
      ).toBeNull();
      expect(singleVisibleResource([bookmark('a'), note('n')], ALL)).toBeNull();
    });

    it('returns null when the type is not activatable on the surface', () => {
      expect(singleVisibleResource([note('n')], ['bookmark'])).toBeNull();
      expect(
        singleVisibleResource([collection('c')], ['bookmark', 'note'])
      ).toBeNull();
    });

    it('returns null when the entry has no id', () => {
      expect(singleVisibleResource([note('')], ALL)).toBeNull();
      expect(
        singleVisibleResource(
          [{ name: 'No id', type: 'collection' } as PinnedCollection],
          ALL
        )
      ).toBeNull();
    });
  });

  describe('activationHintLabel', () => {
    it('names each activatable type', () => {
      expect(activationHintLabel(bookmark('b'))).toBe('bookmark');
      expect(activationHintLabel(note('n'))).toBe('note');
      expect(activationHintLabel(collection('c'))).toBe('collection');
    });

    it('returns null when nothing would be activated', () => {
      expect(activationHintLabel(null)).toBeNull();
      expect(activationHintLabel(undefined)).toBeNull();
      expect(
        activationHintLabel({ type: 'snippet' } as UserDataResource)
      ).toBeNull();
    });
  });
});
