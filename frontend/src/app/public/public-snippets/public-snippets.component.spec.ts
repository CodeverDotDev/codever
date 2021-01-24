import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicSnippetsComponent } from './public-snippets.component';

describe('PublicCodeletsComponent', () => {
  let component: PublicSnippetsComponent;
  let fixture: ComponentFixture<PublicSnippetsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublicSnippetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicSnippetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
