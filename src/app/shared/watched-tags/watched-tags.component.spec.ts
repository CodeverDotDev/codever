import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchedTagsComponent } from './watched-tags.component';

describe('WatchedTagsComponent', () => {
  let component: WatchedTagsComponent;
  let fixture: ComponentFixture<WatchedTagsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WatchedTagsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchedTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
