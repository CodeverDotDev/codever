import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteResourceDialogComponent } from './delete-resource-dialog.component';

describe('LoginRequiredDialogComponent', () => {
  let component: DeleteResourceDialogComponent;
  let fixture: ComponentFixture<DeleteResourceDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteResourceDialogComponent ]
    })
    .compileComponents();
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
