import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ShareLinkListResponse,
  ShareLinkResourceStatus,
  ShareableResourceType,
} from './model/share-link';

@Injectable({ providedIn: 'root' })
export class ShareLinksService {
  private readonly apiBaseUrl =
    environment.API_URL + '/personal/users';

  constructor(private httpClient: HttpClient) {}

  getStatus(
    userId: string,
    resourceType: ShareableResourceType,
    resourceId: string
  ): Observable<ShareLinkResourceStatus> {
    return this.httpClient.get<ShareLinkResourceStatus>(
      `${this.apiBaseUrl}/${encodeURIComponent(userId)}/share-links/${resourceType}/${encodeURIComponent(resourceId)}`
    );
  }

  create(
    userId: string,
    resourceType: ShareableResourceType,
    resourceId: string
  ): Observable<ShareLinkResourceStatus> {
    return this.httpClient.post<ShareLinkResourceStatus>(
      `${this.apiBaseUrl}/${encodeURIComponent(userId)}/share-links/${resourceType}/${encodeURIComponent(resourceId)}`,
      {}
    );
  }

  list(
    userId: string,
    page = 1,
    limit = 55
  ): Observable<ShareLinkListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient.get<ShareLinkListResponse>(
      `${this.apiBaseUrl}/${encodeURIComponent(userId)}/share-links`,
      { params }
    );
  }

  revoke(userId: string, shareLinkId: string): Observable<void> {
    return this.httpClient.delete<void>(
      `${this.apiBaseUrl}/${encodeURIComponent(userId)}/share-links/${encodeURIComponent(shareLinkId)}`
    );
  }
}
