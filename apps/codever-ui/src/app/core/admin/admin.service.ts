import { Injectable } from '@angular/core';

import { shareReplay } from 'rxjs/operators';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Bookmark } from '../model/bookmark';
import {
  AdminAuditEntry,
  AdminAuditLogQuery,
  AdminBulkAction,
  AdminBulkResult,
  AdminEntryRef,
  AdminEntryType,
  AdminOverview,
  AdminPublicEntriesQuery,
  AdminPublicEntry,
  AdminRestoreResult,
} from './admin.model';

const ENTRY_PATHS: Record<AdminEntryType, string> = {
  bookmark: 'bookmarks',
  note: 'notes',
};

/** Drops empty values so they are not sent as query parameters. */
const toParams = (query: object): HttpParams => {
  let params = new HttpParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  });
  return params;
};

/**
 * Admin API calls. Responses are deliberately not cached in localStorage:
 * moderation data must always be fresh and must not be kept in the browser.
 */
@Injectable()
export class AdminService {
  private adminApiBaseUrl = '';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private httpClient: HttpClient) {
    this.adminApiBaseUrl = environment.API_URL + '/admin';
  }

  updateBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .put(
        `${this.adminApiBaseUrl}/bookmarks/${bookmark._id}`,
        JSON.stringify(bookmark),
        {
          headers: this.headers,
        }
      )
      .pipe(shareReplay(1));
  }

  deleteBookmark(bookmark: Bookmark): Observable<any> {
    return this.httpClient
      .delete(`${this.adminApiBaseUrl}/bookmarks/${bookmark._id}`, {
        headers: this.headers,
      })
      .pipe(shareReplay(1));
  }

  getOverview(): Observable<AdminOverview> {
    return this.httpClient.get<AdminOverview>(
      `${this.adminApiBaseUrl}/overview`
    );
  }

  getPublicEntries(
    query: AdminPublicEntriesQuery
  ): Observable<AdminPublicEntry[]> {
    return this.httpClient.get<AdminPublicEntry[]>(
      `${this.adminApiBaseUrl}/public-entries`,
      { params: toParams(query) }
    );
  }

  unpublishEntry(entry: AdminEntryRef): Observable<AdminEntryRef> {
    return this.httpClient.patch<AdminEntryRef>(
      `${this.adminApiBaseUrl}/${ENTRY_PATHS[entry.type]}/${entry.id}/unpublish`,
      {}
    );
  }

  deleteEntry(entry: AdminEntryRef): Observable<void> {
    return this.httpClient.delete<void>(
      `${this.adminApiBaseUrl}/${ENTRY_PATHS[entry.type]}/${entry.id}`
    );
  }

  bulkModerate(
    action: AdminBulkAction,
    entries: AdminEntryRef[]
  ): Observable<AdminBulkResult> {
    return this.httpClient.post<AdminBulkResult>(
      `${this.adminApiBaseUrl}/moderation/bulk`,
      {
        action,
        entries: entries.map(({ type, id }) => ({ type, id })),
      }
    );
  }

  getAuditLog(query: AdminAuditLogQuery): Observable<AdminAuditEntry[]> {
    return this.httpClient.get<AdminAuditEntry[]>(
      `${this.adminApiBaseUrl}/audit-log`,
      { params: toParams(query) }
    );
  }

  restoreDeletedEntry(auditEntryId: string): Observable<AdminRestoreResult> {
    return this.httpClient.post<AdminRestoreResult>(
      `${this.adminApiBaseUrl}/audit-log/${auditEntryId}/restore`,
      {}
    );
  }
}
