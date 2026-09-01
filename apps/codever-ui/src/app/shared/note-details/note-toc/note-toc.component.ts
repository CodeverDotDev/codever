import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

@Component({
    selector: 'app-note-toc',
    templateUrl: './note-toc.component.html',
    styleUrls: ['./note-toc.component.scss'],
    standalone: false
})
export class NoteTocComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input()
  headings: TocHeading[] = [];

  activeHeadingId: string | null = null;

  private headingElements: HTMLElement[] = [];
  private scrollHandler: (() => void) | null = null;
  private rafId: number | null = null;

  constructor(
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngAfterViewInit(): void {
    // Defer setup so headings are in the DOM after Angular renders innerHtml
    setTimeout(() => this.setupScrollSpy(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // The `headings` input arrives asynchronously (the parent extracts headings
    // and assigns the DOM ids after the markdown is rendered). Rebuild the
    // scroll-spy whenever the headings actually change so it tracks them.
    if (changes['headings'] && this.headings?.length) {
      // Let the parent finish assigning ids on the heading elements first.
      setTimeout(() => this.setupScrollSpy(), 0);
    }
  }

  ngOnDestroy(): void {
    this.teardownScrollSpy();
  }

  private readonly HEADER_OFFSET = 80; // px, keeps heading below the fixed header

  scrollToHeading(id: string): void {
    const el = this.document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - this.HEADER_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
      // Reflect the click immediately; the scroll listener keeps it in sync after.
      this.activeHeadingId = id;
    }
  }

  /** Recompute which heading is "current" based on live scroll positions. */
  private updateActiveHeading = (): void => {
    if (!this.headingElements.length) {
      return;
    }

    // Activation line sits a little below the fixed-navbar offset so the heading
    // you just scrolled to reliably counts as active.
    const activationLine = this.HEADER_OFFSET + 16; // px from top of viewport
    let current: HTMLElement | null = null;

    for (const el of this.headingElements) {
      if (el.getBoundingClientRect().top <= activationLine) {
        // Last heading whose top has scrolled above the activation line.
        current = el;
      } else {
        break;
      }
    }

    // If the page is scrolled to the very bottom, the last headings may never
    // reach the activation line — force the last one active in that case.
    const scrolledToBottom =
      window.innerHeight + window.scrollY >=
      this.document.documentElement.scrollHeight - 2;
    if (scrolledToBottom) {
      current = this.headingElements[this.headingElements.length - 1];
    }

    // Before the first heading reaches the line, keep the first one active.
    if (!current) {
      current = this.headingElements[0];
    }

    this.activeHeadingId = current.id;
  };

  private setupScrollSpy(): void {
    this.teardownScrollSpy();

    this.headingElements = this.headings
      .map((h) => this.document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (!this.headingElements.length) {
      return;
    }

    // rAF-throttled scroll handler: always evaluates the final scroll position,
    // unlike IntersectionObserver which only fires on boundary crossings and can
    // miss where a smooth-scroll actually settles.
    this.scrollHandler = () => {
      if (this.rafId !== null) {
        return;
      }
      this.rafId = window.requestAnimationFrame(() => {
        this.rafId = null;
        this.updateActiveHeading();
      });
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });

    // Set the initial active heading immediately (don't wait for the first scroll).
    this.updateActiveHeading();
  }

  private teardownScrollSpy(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
      this.scrollHandler = null;
    }
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
