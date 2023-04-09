import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopySnippetButtonComponent } from './copy-snippet-button.component';

describe('CopySnippetButtonComponent', () => {
  let component: CopySnippetButtonComponent;
  let fixture: ComponentFixture<CopySnippetButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CopySnippetButtonComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopySnippetButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
