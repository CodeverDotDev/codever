import { CopyableField } from './copyable-field';

export type DraftResourceType = 'bookmark' | 'note';

export const DRAFT_KEY_PREFIX = 'codever-draft:v2:';
export const DRAFT_SCHEMA_VERSION = 2;
/** Drafts older than this (by last save) are removed. */
export const DRAFT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
/** Most drafts kept per user and type; the oldest are removed first. */
export const DRAFT_MAX_PER_TYPE = 10;

/** One stored draft: a user may keep several drafts per resource type. */
export interface DraftIdentity {
  userId: string;
  type: DraftResourceType;
  id: string;
}

/** Raw editable copyable-field row; incomplete rows are preserved. */
export interface DraftCopyableField {
  label: string;
  value: string;
}

export interface NoteDraftForm {
  title: string;
  reference: string;
  tags: string[];
  content: string;
  public: boolean;
  copyableFields: DraftCopyableField[];
}

export interface NoteDraftOptions {
  collectionIds: string[];
}

export interface BookmarkDraftForm {
  name: string;
  location: string;
  tags: string[];
  publishedOn: string | null;
  sourceCodeURL: string;
  description: string;
  public: boolean;
  language: string | null;
  youtubeVideoId: string | null;
  stackoverflowQuestionId: string | null;
  copyableFields: DraftCopyableField[];
}

export interface BookmarkDraftOptions {
  readLater: boolean;
  pinned: boolean;
  collectionIds: string[];
}

export interface DraftSnapshot<F = unknown, O = unknown> {
  form: F;
  options: O;
}

export type NoteDraftSnapshot = DraftSnapshot<NoteDraftForm, NoteDraftOptions>;
export type BookmarkDraftSnapshot = DraftSnapshot<
  BookmarkDraftForm,
  BookmarkDraftOptions
>;

export interface DraftRecord<F = unknown, O = unknown>
  extends DraftSnapshot<F, O> {
  schemaVersion: number;
  identity: DraftIdentity;
  savedAt: string;
}

/** Identity of a new draft; pass `id` to address an existing one. */
export function createDraftIdentity(
  userId: string,
  type: DraftResourceType,
  id: string = newDraftId()
): DraftIdentity {
  return { userId, type, id };
}

export function draftKey(identity: DraftIdentity): string {
  return `${draftTypePrefix(identity.userId, identity.type)}${encodeURIComponent(
    identity.id
  )}`;
}

export function draftUserPrefix(userId: string): string {
  return `${DRAFT_KEY_PREFIX}${encodeURIComponent(userId)}:`;
}

export function draftTypePrefix(
  userId: string,
  type: DraftResourceType
): string {
  return `${draftUserPrefix(userId)}${type}:`;
}

/** Random draft ID; falls back when `crypto.randomUUID` is unavailable. */
export function newDraftId(): string {
  const cryptoApi = (globalThis as { crypto?: Crypto }).crypto;
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Maps form copyable-field rows to raw draft rows without trimming. */
export function rawCopyableFields(
  rows: Partial<CopyableField>[] | null | undefined
): DraftCopyableField[] {
  return (rows || []).map((row) => ({
    label: row?.label ?? '',
    value: row?.value ?? '',
  }));
}
