import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HotKeysDialogComponent } from './hot-keys-dialog.component';

describe('HistoryDialogComponent', () => {
  let component: HotKeysDialogComponent;
  let fixture: ComponentFixture<HotKeysDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HotKeysDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HotKeysDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
