import { describe, expect, it, vi } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { SearchResultsPageComponent } from './search-results-page.component';
import { PersonalSearchService } from '../core/personal-search.service';
import { PublicSearchService } from '../core/public-search.service';
import { AuthenticationService } from '../core/auth/authentication.service';
import { KeycloakServiceWrapper } from '../core/keycloak-service-wrapper.service';
import { UserInfoStore } from '../core/user/user-info.store';
import { UserDataStore } from '../core/user/userdata.store';
import { SearchNotificationService } from '../core/search-notification.service';
import { LoginDialogHelperService } from '../core/login-dialog-helper.service';
import { MatDialog } from '@angular/material/dialog';

describe('SearchResultsComponent', () => {
  let component: SearchResultsPageComponent;
  let fixture: ComponentFixture<SearchResultsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SearchResultsPageComponent],
      providers: [
        provideRouter([]),
        { provide: PersonalSearchService, useValue: {} },
        { provide: PublicSearchService, useValue: {} },
        { provide: AuthenticationService, useValue: { isLoggedIn: () => false } },
        { provide: KeycloakServiceWrapper, useValue: {} },
        { provide: UserInfoStore, useValue: {} },
        { provide: UserDataStore, useValue: {} },
        {
          provide: SearchNotificationService,
          useValue: { updateSearchBar: vi.fn(), searchTriggeredSource$: NEVER },
        },
        { provide: LoginDialogHelperService, useValue: {} },
        { provide: MatDialog, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchResultsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
