import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SnippetTaggedComponent } from './snippet-tagged.component';

xdescribe('TagComponent', () => {
  let component: SnippetTaggedComponent;
  let fixture: ComponentFixture<SnippetTaggedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SnippetTaggedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnippetTaggedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
