import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import {Bookmark} from '../../core/model/bookmark';

@Component({
  selector: 'app-bookmark-text',
  templateUrl: './bookmark-text.component.html',
    styleUrls: [ './bookmark-text.component.scss' ]
})
export class BookmarkTextComponent  implements  AfterViewInit, AfterViewChecked {

  @Input()
  bookmark: Bookmark;

  @Input()
  queryText: string;

  show = false; // add one more property
  public showMoreText = false;

  @ViewChild('bookmarkText', {static: false}) elementView: ElementRef;
  public viewHeight: number;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.viewHeight = this.elementView.nativeElement.offsetHeight;
  }

  ngAfterViewChecked(): void {
    const show = this.viewHeight > 120;
    if (show !== this.show) { // check if it change, tell CD update view
      this.show = show;
      this.changeDetectorRef.detectChanges();
    }
  }
}
