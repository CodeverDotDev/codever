import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetDetailsPageComponent } from './snippet-details-page.component';

describe('CodeletDetailsComponent', () => {
  let component: SnippetDetailsPageComponent;
  let fixture: ComponentFixture<SnippetDetailsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SnippetDetailsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnippetDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
