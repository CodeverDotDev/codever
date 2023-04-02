import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MySearchesComponent } from './my-searches.component';

describe('UserTagsComponent', () => {
  let component: MySearchesComponent;
  let fixture: ComponentFixture<MySearchesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MySearchesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MySearchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
