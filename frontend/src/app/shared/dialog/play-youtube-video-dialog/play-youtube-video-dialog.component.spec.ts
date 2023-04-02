import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayYoutubeVideoDialogComponent } from './play-youtube-video-dialog.component';

describe('PlayYoutubeVideoDialogComponent', () => {
  let component: PlayYoutubeVideoDialogComponent;
  let fixture: ComponentFixture<PlayYoutubeVideoDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PlayYoutubeVideoDialogComponent],
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
