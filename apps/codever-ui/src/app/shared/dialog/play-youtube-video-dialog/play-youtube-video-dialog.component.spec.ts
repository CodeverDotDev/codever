import { describe, expect, it, vi } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PlayYoutubeVideoDialogComponent } from './play-youtube-video-dialog.component';

describe('PlayYoutubeVideoDialogComponent', () => {
  let component: PlayYoutubeVideoDialogComponent;
  let fixture: ComponentFixture<PlayYoutubeVideoDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PlayYoutubeVideoDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { bookmark: { youtubeVideoId: '' } } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayYoutubeVideoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
