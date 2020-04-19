import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteBookmarkDialogComponent } from './delete-bookmark-dialog.component';

describe('LoginRequiredDialogComponent', () => {
  let component: DeleteBookmarkDialogComponent;
  let fixture: ComponentFixture<DeleteBookmarkDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteBookmarkDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteBookmarkDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
