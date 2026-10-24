import { describe, expect, it } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarksTaggedComponent } from './bookmarks-tagged.component';

describe.skip('TagComponent', () => {
  let component: BookmarksTaggedComponent;
  let fixture: ComponentFixture<BookmarksTaggedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BookmarksTaggedComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookmarksTaggedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
