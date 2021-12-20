import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebpageInfo } from '../model/webpage-info';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable()
export class WebpageInfoService {

  private readonly webPageInfoApiBaseUrl: string = '';  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.webPageInfoApiBaseUrl = environment.API_URL + '/webpage-info';  // URL to web api
  }

  getScrapingData(location: string): Observable<WebpageInfo> {
    const params = new HttpParams()
      .set('location', location);
    return this.httpClient
      .get<WebpageInfo>(`${this.webPageInfoApiBaseUrl}/scrape`, {params: params});
  }


  getYoutubeVideoData(youtubeVideoId: string) {
    const params = new HttpParams()
      .set('youtubeVideoId', youtubeVideoId)
    return this.httpClient
      .get<WebpageInfo>(`${this.webPageInfoApiBaseUrl}/scrape`, {params: params});
  }

  getStackoverflowQuestionData(stackoverflowQuestionId: string) {
    const params = new HttpParams()
      .set('stackoverflowQuestionId', stackoverflowQuestionId)
    return this.httpClient
      .get<WebpageInfo>(`${this.webPageInfoApiBaseUrl}/scrape`, {params: params});
  }
}
