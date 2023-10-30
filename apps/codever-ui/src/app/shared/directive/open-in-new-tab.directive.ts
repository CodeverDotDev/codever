import { AfterViewInit, Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appOpenInNewTab]',
})
export class OpenInNewTabDirective implements AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    // Get all anchor elements within the element that uses the directive
    const anchorElements = this.el.nativeElement.getElementsByTagName('a');

    // Set the target attribute to "_blank" for each anchor element
    for (const anchorElement of anchorElements) {
      this.renderer.setAttribute(anchorElement, 'target', '_blank');
    }
  }
}
