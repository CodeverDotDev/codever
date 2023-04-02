import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HowtoHotkeysComponent } from './howto-hotkeys.component';

describe('HowtoHotkeysComponent', () => {
  let component: HowtoHotkeysComponent;
  let fixture: ComponentFixture<HowtoHotkeysComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HowtoHotkeysComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HowtoHotkeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
