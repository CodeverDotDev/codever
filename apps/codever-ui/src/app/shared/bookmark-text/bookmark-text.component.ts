import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { AddToHistoryService } from '../../core/user/add-to-history.service';

@Component({
  selector: 'app-bookmark-text',
  templateUrl: './bookmark-text.component.html',
})
export class BookmarkTextComponent implements AfterViewInit, AfterViewChecked {
  @Input()
  bookmark: Bookmark;

  @Input()
  userIsLoggedIn = false;

  @Input()
  queryText: string;

  show = false; // add one more property

  @Input()
  public showMoreText = false;

  @ViewChild('bookmarkText', { static: false }) elementView: ElementRef;
  public viewHeight: number;

  constructor(
    private addToHistoryService: AddToHistoryService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.viewHeight = this.elementView.nativeElement.offsetHeight;
  }

  ngAfterViewChecked(): void {
    const show = this.viewHeight > 120;
    if (show !== this.show) {
      // check if it change, tell CD update view
      this.show = show;
      this.changeDetectorRef.detectChanges();
    }
  }

  addToHistoryWhenClickOnLink(event: Event) {
    this.addToHistoryService.onClickInDescription(
      this.userIsLoggedIn,
      event,
      this.bookmark
    );
  }

  addToHistoryWhenMiddleClickOnLink(event: MouseEvent) {
    this.addToHistoryService.onMiddleClickInDescription(
      this.userIsLoggedIn,
      event,
      this.bookmark
    );
  }
}
