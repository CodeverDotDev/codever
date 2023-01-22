import { AfterViewChecked, Directive, ElementRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Directive({
  selector: '[appMarkedImageWidth]'
})
export class MarkedImageWidthDirective implements AfterViewChecked {

  public images: any[] = [];

  constructor(private el: ElementRef, public dialog: MatDialog) {
  }

  ngAfterViewChecked() {
    const imgElements = this.el.nativeElement.querySelectorAll('img');
    imgElements.forEach(img => {
      img.style.width = '100%';
    });
  }
}
