import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindElsewhereComponent } from './find-elsewhere.component';

describe('FindElsewhereComponent', () => {
  let component: FindElsewhereComponent;
  let fixture: ComponentFixture<FindElsewhereComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FindElsewhereComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FindElsewhereComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
