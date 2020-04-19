import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteCodeletDialogComponent } from './delete-codelet-dialog.component';

describe('LoginRequiredDialogComponent', () => {
  let component: DeleteCodeletDialogComponent;
  let fixture: ComponentFixture<DeleteCodeletDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteCodeletDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteCodeletDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
