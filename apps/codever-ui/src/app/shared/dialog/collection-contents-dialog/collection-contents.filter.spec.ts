import { Bookmark } from '../../../core/model/bookmark';
import { Note } from '../../../core/model/note';
import { filterCollectionContents } from './collection-contents.filter';

const bookmark = (overrides: Partial<Bookmark>): Bookmark =>
  ({ _id: 'b', type: 'bookmark', ...overrides } as Bookmark);
const note = (overrides: Partial<Note>): Note =>
  ({ _id: 'n', type: 'note', ...overrides } as Note);

describe('filterCollectionContents', () => {
  const bookmarks = [
    bookmark({ _id: 'b1', name: 'Angular guide', tags: ['frontend'] }),
    bookmark({ _id: 'b2', name: 'Node streams', tags: ['backend'] }),
  ];
  const notes = [
    note({ _id: 'n1', title: 'Angular signals', tags: ['frontend'] }),
    note({ _id: 'n2', title: 'Mongo tips', tags: ['database'] }),
  ];

  it('returns everything for an empty filter', () => {
    const result = filterCollectionContents(bookmarks, notes, '   ');

    expect(result.bookmarks.length).toBe(2);
    expect(result.notes.length).toBe(2);
  });

  it('matches bookmarks and notes by name/title', () => {
    const result = filterCollectionContents(bookmarks, notes, 'angular');

    expect(result.bookmarks.map((b) => b._id)).toEqual(['b1']);
    expect(result.notes.map((n) => n._id)).toEqual(['n1']);
  });

  it('matches by tag across both types, case-insensitively', () => {
    const result = filterCollectionContents(bookmarks, notes, 'DATABASE');

    expect(result.bookmarks.length).toBe(0);
    expect(result.notes.map((n) => n._id)).toEqual(['n2']);
  });

  it('does not mutate the input arrays', () => {
    const result = filterCollectionContents(bookmarks, notes, '');

    result.bookmarks.push(bookmark({ _id: 'b3' }));
    expect(bookmarks.length).toBe(2);
    expect(result.bookmarks.length).toBe(3);
  });
});
