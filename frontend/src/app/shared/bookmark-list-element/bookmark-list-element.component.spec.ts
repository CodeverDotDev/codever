import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarkListElementComponent } from './bookmark-list-element.component';

describe('BookmarkListElementComponent', () => {
  let component: BookmarkListElementComponent;
  let fixture: ComponentFixture<BookmarkListElementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BookmarkListElementComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookmarkListElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
