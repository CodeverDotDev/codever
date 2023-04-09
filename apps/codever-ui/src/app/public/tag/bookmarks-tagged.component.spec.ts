import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarksTaggedComponent } from './bookmarks-tagged.component';

xdescribe('TagComponent', () => {
  let component: BookmarksTaggedComponent;
  let fixture: ComponentFixture<BookmarksTaggedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BookmarksTaggedComponent],
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
