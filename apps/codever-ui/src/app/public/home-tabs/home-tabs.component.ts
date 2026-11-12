import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragMove,
  CdkDragStart,
  CdkDropList,
  DragRef,
  moveItemInArray,
  Point,
} from '@angular/cdk/drag-drop';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { ErrorService } from '../../core/error/error.service';
import {
  HOME_TABS,
  HomeTab,
  HomeTabId,
  resolveHomeTabs,
} from '../../core/home-tabs/home-tabs';
import { UserDataStore } from '../../core/user/userdata.store';
import {
  constrainTabDragPosition,
  getOverlapDropIndex,
  getShiftOffsets,
  TabSlot,
} from './home-tab-sorting';

const SHIFT_TRANSITION = 'transform 200ms cubic-bezier(0, 0, 0.2, 1)';

@Component({
  selector: 'app-home-tabs',
  templateUrl: './home-tabs.component.html',
  styleUrls: ['./home-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatTabsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
})
export class HomeTabsComponent implements OnDestroy {
  readonly userIsLoggedIn: boolean;
  tabs: HomeTab[] = [...HOME_TABS];

  private readonly userDataSubscription: Subscription | undefined;
  private confirmedTabs: HomeTab[] = [...HOME_TABS];
  private saveInFlight = false;
  private saveQueued = false;
  private dragElements: HTMLElement[] = [];
  private dragSlots: TabSlot[] = [];
  private dragFromIndex = -1;
  private dragTargetIndex: number | undefined;

  constructor(
    authenticationService: AuthenticationService,
    private readonly userDataStore: UserDataStore,
    private readonly errorService: ErrorService
  ) {
    this.userIsLoggedIn = authenticationService.isLoggedIn();
    this.userDataSubscription = this.userIsLoggedIn
      ? userDataStore.getUserData$().subscribe((userData) => {
          this.confirmedTabs = this.toTabs(userData.homeTabs);
          if (!this.saving && this.dragFromIndex < 0) {
            this.tabs = [...this.confirmedTabs];
          }
        })
      : undefined;
  }

  get saving(): boolean {
    return this.saveInFlight || this.saveQueued;
  }

  readonly constrainDragPosition = (
    pointer: Point,
    _dragRef: DragRef,
    initialRect: DOMRect,
    pickupInElement: Point
  ): Point => constrainTabDragPosition(pointer, initialRect.top, pickupInElement);

  dragStarted(event: CdkDragStart): void {
    const container = event.source.dropContainer?.element.nativeElement;
    const placeholder = event.source.getPlaceholderElement();
    if (!container || !placeholder) {
      return;
    }
    this.dragElements = Array.from(
      container.querySelectorAll<HTMLElement>('.home-tab-link')
    ).filter((element) => !element.classList.contains('cdk-drag-preview'));
    this.dragSlots = this.dragElements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    });
    this.dragFromIndex = this.dragElements.indexOf(placeholder);
    this.dragTargetIndex = this.dragFromIndex;
    this.dragElements.forEach((element) => {
      element.style.transition = SHIFT_TRANSITION;
    });
  }

  dragMoved(event: CdkDragMove): void {
    if (this.dragFromIndex < 0) {
      return;
    }
    const from = this.dragSlots[this.dragFromIndex];
    // With a position constraint, pointerPosition is the preview's top-left.
    const left = event.pointerPosition.x;
    const target = getOverlapDropIndex(
      this.dragSlots,
      this.dragFromIndex,
      left,
      left + from.right - from.left
    );
    if (target === this.dragTargetIndex) {
      return;
    }
    this.dragTargetIndex = target;
    const offsets = getShiftOffsets(this.dragSlots, this.dragFromIndex, target);
    this.dragElements.forEach((element, index) => {
      element.style.transform = offsets[index]
        ? `translate3d(${offsets[index]}px, 0, 0)`
        : '';
    });
  }

  dragEnded(): void {
    this.dragElements.forEach((element) => {
      element.style.transition = 'none';
      element.style.transform = '';
    });
    this.dragElements = [];
    this.dragSlots = [];
    this.dragFromIndex = -1;
  }

  drop(event: CdkDragDrop<HomeTab[]>): void {
    const currentIndex = this.dragTargetIndex ?? event.currentIndex;
    this.dragTargetIndex = undefined;
    if (!this.userIsLoggedIn || event.previousIndex === currentIndex) {
      return;
    }

    moveItemInArray(this.tabs, event.previousIndex, currentIndex);
    this.tabs = [...this.tabs];
    this.saveTabOrder();
  }

  /** Sends the latest order; drops made while a save is in flight are batched. */
  private saveTabOrder(): void {
    if (this.saveInFlight) {
      this.saveQueued = true;
      return;
    }
    this.saveInFlight = true;
    this.saveQueued = false;
    const homeTabs = this.tabs.map((tab) => tab.id);

    this.userDataStore.updateHomeTabs$(homeTabs).subscribe({
      next: () => {
        this.saveInFlight = false;
        if (this.saveQueued) {
          this.saveTabOrder();
        }
      },
      error: () => {
        this.saveInFlight = false;
        this.saveQueued = false;
        this.tabs = [...this.confirmedTabs];
        this.errorService.handleError({
          title: 'Unable to save tab order',
          messages: ['Please try again.'],
        });
      },
    });
  }

  private toTabs(savedOrder?: readonly string[]): HomeTab[] {
    const tabsById = new Map<HomeTabId, HomeTab>(
      HOME_TABS.map((tab) => [tab.id, tab])
    );
    return resolveHomeTabs(savedOrder).map((id) => {
      const tab = tabsById.get(id);
      if (!tab) {
        throw new Error(`Missing home tab metadata for ${id}`);
      }
      return tab;
    });
  }

  ngOnDestroy(): void {
    this.userDataSubscription?.unsubscribe();
  }
}
