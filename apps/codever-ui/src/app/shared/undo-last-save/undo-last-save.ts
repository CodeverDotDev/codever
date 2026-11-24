import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';

export type UndoLastSaveEntryType = 'bookmark' | 'note';

/** Router-state key under which an editor hands the pre-save entry over. */
export const UNDO_LAST_SAVE_STATE_KEY = 'undoLastSave';

/**
 * The fields an edit can change. Undo writes every one of them back, so a
 * field the save filled in is cleared again: a PUT leaves missing fields as
 * they are.
 */
const CONTENT_FIELDS: Record<UndoLastSaveEntryType, string[]> = {
  note: [
    'title',
    'content',
    'contentType',
    'notebookContent',
    'reference',
    'tags',
    'copyableFields',
    'public',
  ],
  bookmark: [
    'name',
    'location',
    'description',
    'descriptionHtml',
    'tags',
    'copyableFields',
    'publishedOn',
    'sourceCodeURL',
    'language',
    'youtubeVideoId',
    'stackoverflowQuestionId',
    'public',
  ],
};

const EMPTY_VALUES: Record<string, unknown> = {
  tags: [],
  copyableFields: [],
  public: false,
};

/** The full update that puts the entry from before the save back. */
export function toUndoUpdate<T extends Bookmark | Note>(
  entryType: UndoLastSaveEntryType,
  before: T
): T {
  const update: Record<string, unknown> = { ...before };
  for (const field of CONTENT_FIELDS[entryType]) {
    if (update[field] === undefined || update[field] === null) {
      update[field] = field in EMPTY_VALUES ? EMPTY_VALUES[field] : null;
    }
  }
  update['updatedAt'] = new Date();
  return update as T;
}

/**
 * Takes the pre-save entry an editor passed to the details page of `entryId`
 * and removes it from the browser history entry, so the undo is offered only
 * once: after leaving, reloading or coming back, it is gone.
 */
export function takeUndoLastSave<T extends { _id?: string }>(
  entryId: string
): T | null {
  const state = window.history.state;
  const before = state?.[UNDO_LAST_SAVE_STATE_KEY] as T | undefined;
  if (!before) {
    return null;
  }
  window.history.replaceState(
    { ...state, [UNDO_LAST_SAVE_STATE_KEY]: undefined },
    ''
  );
  return before._id === entryId ? before : null;
}
