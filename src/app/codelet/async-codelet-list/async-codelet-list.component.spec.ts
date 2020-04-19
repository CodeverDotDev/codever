import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncCodeletListComponent } from './async-codelet-list.component';

describe('AsyncCodeletListComponent', () => {
  let component: AsyncCodeletListComponent;
  let fixture: ComponentFixture<AsyncCodeletListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AsyncCodeletListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AsyncCodeletListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
