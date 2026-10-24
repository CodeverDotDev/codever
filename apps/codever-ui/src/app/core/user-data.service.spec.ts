import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { HttpClientLocalStorageService } from './cache/http-client-local-storage.service';
import { UserFavoriteMutation } from './model/user-data';
import { UserDataService } from './user-data.service';

describe('UserDataService favorites', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        UserDataService,
        {
          provide: HttpClientLocalStorageService,
          useValue: {},
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the typed favorite mutation to the personal endpoint', () => {
    const mutation: UserFavoriteMutation = {
      resourceType: 'note',
      resourceId: 'note-id',
      favorite: true,
    };
    const service = TestBed.inject(UserDataService);

    service.updateUserFavorite('owner', mutation).subscribe((response) => {
      expect(response).toEqual(mutation);
    });

    const request = http.expectOne(
      `${environment.API_URL}/personal/users/owner/favorites`
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(mutation);
    request.flush(mutation);
  });
});
