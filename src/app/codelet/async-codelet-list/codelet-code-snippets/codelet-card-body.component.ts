import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import { Codelet } from '../../../core/model/codelet';

@Component({
  selector: 'app-codelet-card-body',
  templateUrl: './codelet-card-body.component.html',
    styleUrls: [ './codelet-card-body.component.scss' ]
})
export class CodeletCardBodyComponent  implements  AfterViewInit, AfterViewChecked {

  @Input()
  codelet: Codelet;

  @Input()
  queryText: string;

  show = false; // add one more property
  public showMoreText = false;

  @ViewChild('codeletCardBody', {static: false}) elementView: ElementRef;
  public viewHeight: number;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.viewHeight = this.elementView.nativeElement.offsetHeight;
  }

  ngAfterViewChecked(): void {
    const show = this.viewHeight > 180;
    if (show !== this.show) { // check if it change, tell CD update view
      this.show = show;
      this.changeDetectorRef.detectChanges();
    }
  }

}
