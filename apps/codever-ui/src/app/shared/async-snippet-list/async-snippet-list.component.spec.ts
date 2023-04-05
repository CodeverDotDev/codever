import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncSnippetListComponent } from './async-snippet-list.component';

describe('AsyncCodeletListComponent', () => {
  let component: AsyncSnippetListComponent;
  let fixture: ComponentFixture<AsyncSnippetListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AsyncSnippetListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AsyncSnippetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
