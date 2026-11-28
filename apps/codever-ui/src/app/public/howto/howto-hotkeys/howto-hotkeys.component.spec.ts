import { describe, expect, it } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { HowtoHotkeysComponent } from './howto-hotkeys.component';

describe('HowtoHotkeysComponent', () => {
  let component: HowtoHotkeysComponent;
  let fixture: ComponentFixture<HowtoHotkeysComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HowtoHotkeysComponent],
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

  it('lists the shortcuts for editing notes and bookmarks', () => {
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('li strong') as NodeListOf<
        HTMLElement
      >
    ).map((element) => element.textContent?.trim());

    expect(items).toEqual(
      expect.arrayContaining(['e', 'Ctrl/Cmd+Enter', 'Esc'])
    );
  });
});
