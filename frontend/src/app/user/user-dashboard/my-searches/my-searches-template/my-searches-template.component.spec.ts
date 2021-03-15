import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MySearchesTemplateComponent } from './my-searches-template.component';

describe('MySearchesTemplateComponent', () => {
  let component: MySearchesTemplateComponent;
  let fixture: ComponentFixture<MySearchesTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MySearchesTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MySearchesTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
