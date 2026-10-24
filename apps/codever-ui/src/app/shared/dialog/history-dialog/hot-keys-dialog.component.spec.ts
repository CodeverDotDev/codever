import { describe, expect, it, vi } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { HotKeysDialogComponent } from './hot-keys-dialog.component';
import { AddToHistoryService } from '../../../core/user/add-to-history.service';
import { MainLinkShortcutService } from '../../../core/shortcut/main-link-shortcut.service';

describe('HistoryDialogComponent', () => {
  let component: HotKeysDialogComponent;
  let fixture: ComponentFixture<HotKeysDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HotKeysDialogComponent],
      providers: [
        provideRouter([]),
        { provide: MAT_DIALOG_DATA, useValue: { resources$: of([]), title: '' } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: AddToHistoryService, useValue: {} },
        {
          provide: MainLinkShortcutService,
          useValue: { register: vi.fn(), unregister: vi.fn() },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HotKeysDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
