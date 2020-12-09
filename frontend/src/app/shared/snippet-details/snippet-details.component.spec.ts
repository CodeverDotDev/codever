import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetDetailsComponent } from './snippet-details.component';

describe('CodeletDetailsComponent', () => {
  let component: SnippetDetailsComponent;
  let fixture: ComponentFixture<SnippetDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SnippetDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnippetDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
