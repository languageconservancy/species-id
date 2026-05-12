import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
} from '@angular/core';

/**
 * Title layout:
 * - Newlines (merged Crow names): `pre-line` wrapping.
 * - Multiple words (whitespace): normal wrap at word boundaries only.
 * - Single long token: shrink font to fit one line (ResizeObserver + MutationObserver).
 */
@Directive({
  selector: '[appShrinkToFitText]',
  standalone: true,
})
export class ShrinkToFitTextDirective implements AfterViewInit, OnDestroy {
  /** Minimum font size in px when shrinking (readability floor). */
  @Input() appShrinkToFitTextMin = 16;

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private rafId = 0;

  constructor(
    private host: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private document: Document,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.scheduleFit());
    this.resizeObserver.observe(this.host.nativeElement);
    const parent = this.host.nativeElement.parentElement;
    if (parent) {
      this.resizeObserver.observe(parent);
    }

    this.mutationObserver = new MutationObserver(() => this.scheduleFit());
    this.mutationObserver.observe(this.host.nativeElement, {
      characterData: true,
      subtree: true,
      childList: true,
    });

    this.scheduleFit();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  private scheduleFit(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this.ngZone.runOutsideAngular(() => this.applyFit());
    });
  }

  private applyFit(): void {
    const el = this.host.nativeElement;
    const win = this.document.defaultView;
    if (!win) {
      return;
    }

    const text = el.textContent ?? '';
    const trimmed = text.trim();

    // Reset branch-specific styles before applying a mode (text can change between renders).
    el.style.wordBreak = '';
    el.style.overflowWrap = '';

    // Merged Crow names use newlines; let them wrap as multiple lines (no single-line shrink).
    if (text.includes('\n')) {
      el.style.whiteSpace = 'pre-line';
      el.style.display = 'block';
      el.style.width = '100%';
      el.style.maxWidth = '100%';
      el.style.fontSize = '';
      el.style.overflow = '';
      el.style.textOverflow = '';
      return;
    }

    // Multiple words: wrap at spaces only (no mid-word breaks, no single-line shrink).
    if (trimmed.length > 0 && /\s/.test(trimmed)) {
      el.style.whiteSpace = 'normal';
      el.style.wordBreak = 'normal';
      el.style.overflowWrap = 'normal';
      el.style.display = 'block';
      el.style.width = '100%';
      el.style.maxWidth = '100%';
      el.style.fontSize = '';
      el.style.overflow = '';
      el.style.textOverflow = '';
      return;
    }

    el.style.whiteSpace = 'nowrap';
    el.style.display = 'block';
    el.style.width = '100%';
    el.style.maxWidth = '100%';

    el.style.fontSize = '';
    el.style.textOverflow = '';
    el.style.overflow = '';
    void el.offsetWidth;

    const clientWidth = el.clientWidth;
    if (clientWidth <= 0) {
      return;
    }

    const computed = win.getComputedStyle(el);
    const maxPx = parseFloat(computed.fontSize);
    if (!Number.isFinite(maxPx) || maxPx <= 0) {
      return;
    }

    const minPx = Math.min(this.appShrinkToFitTextMin, maxPx);

    el.style.fontSize = `${maxPx}px`;
    void el.offsetWidth;

    if (el.scrollWidth <= clientWidth) {
      el.style.fontSize = '';
      return;
    }

    let lo = minPx;
    let hi = maxPx;
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      void el.offsetWidth;
      if (el.scrollWidth <= clientWidth) {
        hi = mid;
      } else {
        lo = mid;
      }
    }

    el.style.fontSize = `${hi}px`;
    void el.offsetWidth;

    if (el.scrollWidth > clientWidth) {
      el.style.overflow = 'hidden';
      el.style.textOverflow = 'ellipsis';
    }
  }
}
