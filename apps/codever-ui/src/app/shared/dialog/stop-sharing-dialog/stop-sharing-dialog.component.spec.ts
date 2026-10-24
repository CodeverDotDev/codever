import { describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StopSharingDialogComponent } from './stop-sharing-dialog.component';

describe('StopSharingDialogComponent', () => {
  let component: StopSharingDialogComponent;
  let fixture: ComponentFixture<StopSharingDialogComponent>;
  let dialogRefClose: ReturnType<typeof vi.fn>;

  beforeEach(waitForAsync(() => {
    dialogRefClose = vi.fn();
    TestBed.configureTestingModule({
      imports: [StopSharingDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { resourceTitle: 'My Shared Resource' },
        },
        {
          provide: MatDialogRef,
          useValue: { close: dialogRefClose },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StopSharingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display resource title', () => {
    expect(component).toBeTruthy();
    expect(component.resourceTitle).toBe('My Shared Resource');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('My Shared Resource');
    expect(compiled.textContent).toContain('Stop sharing');
  });

  it('closes with CONFIRM when confirm is called', () => {
    component.confirm();
    expect(dialogRefClose).toHaveBeenCalledWith('CONFIRM');
  });

  it('closes with CANCEL when close is called', () => {
    component.close();
    expect(dialogRefClose).toHaveBeenCalledWith('CANCEL');
  });
});
