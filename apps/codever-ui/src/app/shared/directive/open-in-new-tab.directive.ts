import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appOpenInNewTab]',
})
export class OpenInNewTabDirective implements AfterViewInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    // Eagerly tag the anchors present on first render.
    this.applyToAnchors();
  }

  // Re-resolve on click/middle-click so anchors rendered *after* ngAfterViewInit
  // (e.g. when the "show more/less" template switches, or highlightHtml re-runs)
  // still open in a new tab. Setting target during the click event takes effect
  // before the browser performs the default navigation. Using `closest('a')`
  // also covers clicks landing on inline children of a link (bold/em/code).
  @HostListener('click', ['$event'])
  @HostListener('auxclick', ['$event'])
  onAnchorClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const anchor =
      target && typeof target.closest === 'function'
        ? (target.closest('a') as HTMLAnchorElement | null)
        : null;
    if (anchor) {
      this.setNewTab(anchor);
    }
  }

  private applyToAnchors() {
    // Get all anchor elements within the element that uses the directive
    const anchorElements = this.el.nativeElement.getElementsByTagName('a');
    for (const anchorElement of anchorElements) {
      this.setNewTab(anchorElement);
    }
  }

  // Open in a new tab. `rel="noopener noreferrer"` matches the behaviour of
  // markdown-rendered note links: it stops the opened page from accessing
  // `window.opener` and avoids leaking the referrer.
  private setNewTab(anchor: Element) {
    this.renderer.setAttribute(anchor, 'target', '_blank');
    this.renderer.setAttribute(anchor, 'rel', 'noopener noreferrer');
  }
}
