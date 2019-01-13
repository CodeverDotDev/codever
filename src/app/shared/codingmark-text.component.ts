import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import {Codingmark} from '../core/model/codingmark';

@Component({
  selector: 'app-codingmark-text',
  templateUrl: './codingmark-text.component.html',
    styleUrls: [ './codingmark-text.component.scss' ]
})
export class CodingmarkTextComponent  implements  AfterViewInit, AfterViewChecked {

  @Input()
  codingmark: Codingmark;

  show = false; // add one more property

  @ViewChild('codingmarkText') elementView: ElementRef;
  public viewHeight: number;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.viewHeight = this.elementView.nativeElement.offsetHeight;
  }

  ngAfterViewChecked(): void {
    const show = this.viewHeight > 100;
    if (show !== this.show) { // check if it change, tell CD update view
      this.show = show;
      this.changeDetectorRef.detectChanges();
    }
  }
}
