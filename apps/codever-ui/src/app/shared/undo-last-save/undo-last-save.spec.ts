import { afterEach, describe, expect, it } from 'vitest';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';
import {
  takeUndoLastSave,
  toUndoUpdate,
  UNDO_LAST_SAVE_STATE_KEY,
} from './undo-last-save';

describe('toUndoUpdate', () => {
  it('clears note fields the save filled in and keeps the rest', () => {
    const before = {
      _id: 'n1',
      userId: 'owner',
      title: 'Old',
      content: 'First\n\nImportant paragraph',
      tags: ['a'],
    } as Note;

    const update = toUndoUpdate('note', before);

    expect(update).toMatchObject({
      _id: 'n1',
      userId: 'owner',
      title: 'Old',
      content: 'First\n\nImportant paragraph',
      tags: ['a'],
      reference: null,
      notebookContent: null,
      copyableFields: [],
      public: false,
    });
    expect(update.updatedAt).toBeInstanceOf(Date);
    expect(before).not.toHaveProperty('reference');
  });

  it('clears bookmark fields the save filled in', () => {
    const update = toUndoUpdate('bookmark', {
      _id: 'b1',
      name: 'B',
      location: 'https://example.com',
      tags: [],
      public: true,
    } as Bookmark);

    expect(update).toMatchObject({
      public: true,
      description: null,
      sourceCodeURL: null,
      youtubeVideoId: null,
      copyableFields: [],
    });
  });
});

describe('takeUndoLastSave', () => {
  afterEach(() => window.history.replaceState({}, ''));

  it('returns the handed-over entry once and removes it from history', () => {
    window.history.replaceState(
      { other: 1, [UNDO_LAST_SAVE_STATE_KEY]: { _id: 'n1', title: 'Old' } },
      ''
    );

    expect(takeUndoLastSave('n1')).toEqual({ _id: 'n1', title: 'Old' });
    expect(window.history.state.other).toBe(1);
    expect(takeUndoLastSave('n1')).toBeNull();
  });

  it('ignores an entry handed over for another id', () => {
    window.history.replaceState(
      { [UNDO_LAST_SAVE_STATE_KEY]: { _id: 'other' } },
      ''
    );

    expect(takeUndoLastSave('n1')).toBeNull();
  });
});
