import { describe, expect, it, vi } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DeleteResourceDialogComponent } from './delete-resource-dialog.component';

describe('LoginRequiredDialogComponent', () => {
  let component: DeleteResourceDialogComponent;
  let fixture: ComponentFixture<DeleteResourceDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DeleteResourceDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { isPublic: false, type: 'bookmark', resourceName: 'Test' },
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteResourceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
