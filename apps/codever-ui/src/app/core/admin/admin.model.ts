export type AdminEntryType = 'bookmark' | 'note';
export type AdminAuditAction = 'unpublish' | 'delete' | 'restore';
export type AdminBulkAction = 'unpublish' | 'delete';

export interface AdminEntryRef {
  type: AdminEntryType;
  id: string;
}

export interface AdminPublicPrivateCount {
  public: number;
  private: number;
}

export interface AdminWindowCounts {
  users: number;
  bookmarks: AdminPublicPrivateCount;
  notes: AdminPublicPrivateCount;
}

export interface AdminOverview {
  generatedAt: string;
  counts: {
    last24h: AdminWindowCounts;
    last7d: AdminWindowCounts;
    last30d: AdminWindowCounts;
  };
  topTags: { tag: string; count: number }[];
  mostActiveUsers: {
    userId: string;
    displayName?: string;
    publicEntries: number;
  }[];
}

export interface AdminPublicEntry extends AdminEntryRef {
  title: string;
  location?: string;
  tags: string[];
  ownerId: string;
  ownerDisplayName?: string;
  createdAt: string;
}

export interface AdminPublicEntriesQuery {
  q?: string;
  type?: 'all' | AdminEntryType;
  userId?: string;
  page: number;
  limit: number;
}

export interface AdminBulkResult {
  succeeded: AdminEntryRef[];
  failed: (AdminEntryRef & { reason: string })[];
}

export interface AdminAuditEntry {
  _id: string;
  action: AdminAuditAction;
  targetType: AdminEntryType;
  targetId: string;
  ownerId?: string;
  adminId: string;
  adminName?: string;
  summary: { title?: string; location?: string };
  restoredAt?: string;
  restoredAsPrivate?: boolean;
  restorable: boolean;
  createdAt: string;
}

export interface AdminAuditLogQuery {
  action?: AdminAuditAction;
  type?: AdminEntryType;
  page: number;
  limit: number;
}

export interface AdminRestoreResult {
  type: AdminEntryType;
  restoredAsPrivate: boolean;
  entry: unknown;
}
