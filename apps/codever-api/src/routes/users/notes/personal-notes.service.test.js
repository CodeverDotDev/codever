jest.mock('../../../model/note', () => {
  const Note = jest.fn();
  Note.findOne = jest.fn();
  Note.findOneAndUpdate = jest.fn();
  return Note;
});
jest.mock('../../../model/user', () => ({}));

const Note = require('../../../model/note');
const ValidationError = require('../../../error/validation.error');
const service = require('./personal-notes.service');

const USER_ID = 'owner';
const NOTE_ID = 'note-id';
const tags = (count) => Array.from({ length: count }, (_, i) => `tag-${i}`);
const save = jest.fn();
const validNote = (extra = {}) => ({
  userId: USER_ID,
  title: 'Note',
  content: '```js\nconst value = 1;\n```',
  ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  Note.mockImplementation((data) => ({ save: () => save(data) }));
  save.mockImplementation(async (data) => ({ ...data, _id: NOTE_ID }));
  Note.findOneAndUpdate.mockImplementation(async (filter, data) => ({ ...data, _id: filter._id }));
});

describe.each(['create', 'update'])('personal note %s tag policy', (operation) => {
  const write = (data) => operation === 'create'
    ? service.createNote(USER_ID, data)
    : service.updateNote(USER_ID, NOTE_ID, data);

  test('persists thirteen normalized tags and preserves content', async () => {
    const data = validNote({ tags: [...tags(13), ' TAG-0 '] });
    const result = await write(data);
    expect(result.tags).toEqual(tags(13));
    expect(result.content).toBe(data.content);
    if (operation === 'create') {
      expect(save).toHaveBeenCalledWith(expect.objectContaining({ tags: tags(13) }));
    } else {
      expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: NOTE_ID, userId: USER_ID },
        expect.objectContaining({ tags: tags(13) }),
        { new: true }
      );
    }
  });

  test('accepts omitted tags', async () => {
    expect((await write(validNote())).tags).toEqual([]);
  });

  test.each([tags(14), [''], ['valid', null], 'tag'].map((input) => [input]))(
    'rejects invalid tags before persistence: %j', async (input) => {
      await expect(write(validNote({ tags: input }))).rejects.toBeInstanceOf(ValidationError);
      expect(Note).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
      expect(Note.findOneAndUpdate).not.toHaveBeenCalled();
    }
  );

  test('preserves existing notebook fields', async () => {
    const result = await write(validNote({
      contentType: 'notebook', notebookContent: '{"cells":[]}', tags: [' Python '],
    }));
    expect(result).toMatchObject({ contentType: 'notebook', notebookContent: '{"cells":[]}', tags: ['python'] });
  });
});

test('reading an existing over-limit note neither normalizes nor rewrites it', async () => {
  const existing = validNote({ _id: NOTE_ID, tags: [...tags(14), ' UPPER '] });
  Note.findOne.mockResolvedValue(existing);
  expect(await service.getNoteById(USER_ID, NOTE_ID)).toBe(existing);
  expect(existing.tags).toEqual([...tags(14), ' UPPER ']);
  expect(Note.findOneAndUpdate).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
});

describe('partial note updates', () => {
  test('applies only supplied fields and normalizes a complete replacement tag list', async () => {
    const result = await service.updateNotePartially(USER_ID, NOTE_ID, {
      title: 'Updated', tags: [' One ', 'two', 'ONE'],
    });

    expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: NOTE_ID, userId: USER_ID },
      { title: 'Updated', tags: ['one', 'two'] },
      { new: true }
    );
    expect(result).toMatchObject({ title: 'Updated', tags: ['one', 'two'] });
  });

  test.each([undefined, null])('returns not-found for %s without writing', async (found) => {
    Note.findOneAndUpdate.mockResolvedValue(found);
    await expect(service.updateNotePartially(USER_ID, NOTE_ID, { title: 'Updated' }))
      .rejects.toBeInstanceOf(require('../../../error/not-found.error'));
    expect(Note.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: NOTE_ID, userId: USER_ID }, { title: 'Updated' }, { new: true }
    );
  });

  test('normalizes tags before attempting the write and rejects fourteen tags', async () => {
    await expect(service.updateNotePartially(USER_ID, NOTE_ID, { tags: tags(14) }))
      .rejects.toBeInstanceOf(ValidationError);
    expect(Note.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

