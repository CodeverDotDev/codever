import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeletDetailsComponent } from './codelet-details.component';

describe('CodeletDetailsComponent', () => {
  let component: CodeletDetailsComponent;
  let fixture: ComponentFixture<CodeletDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CodeletDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeletDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
