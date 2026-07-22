import { AfterViewChecked, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appFullscreenCodeButton]',
})
export class FullscreenCodeButtonDirective implements AfterViewChecked {
  private static stylesInjected = false;

  private static readonly ZOOM_STEP = 10;
  private static readonly ZOOM_MIN = 50;
  private static readonly ZOOM_MAX = 200;
  private static readonly ZOOM_DEFAULT = 100;
  private static readonly BASE_FONT_SIZE = 14;

  constructor(private el: ElementRef) {
    FullscreenCodeButtonDirective.injectStyles();
  }

  private getInitialFontSizePercent(): number {
    const attr = this.el.nativeElement.getAttribute('data-content-font-size');
    const parsed = attr ? parseInt(attr, 10) : FullscreenCodeButtonDirective.ZOOM_DEFAULT;
    return isNaN(parsed) ? FullscreenCodeButtonDirective.ZOOM_DEFAULT : parsed;
  }

  ngAfterViewChecked(): void {
    const preElements = this.el.nativeElement.querySelectorAll('pre');
    preElements.forEach((pre: HTMLElement) => {
      if (pre.getAttribute('data-fullscreen-btn-added') === 'true') {
        return;
      }

      pre.setAttribute('data-fullscreen-btn-added', 'true');
      pre.style.position = 'relative';

      const button = document.createElement('button');
      button.className = 'fullscreen-code-btn';
      button.title = 'View code fullscreen';
      button.innerHTML = '<i class="fas fa-expand"></i>';

      button.addEventListener('click', () => {
        const code = pre.querySelector('code');
        const codeElement = code || pre;
        const d = FullscreenCodeButtonDirective;
        let currentZoom = this.getInitialFontSizePercent();

        const updateFontSize = () => {
          const px = (d.BASE_FONT_SIZE * currentZoom) / 100;
          preClone.style.fontSize = px + 'px';
          zoomIndicator.textContent = currentZoom + '%';
        };

        // Create fullscreen overlay
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-code-overlay';

        const container = document.createElement('div');
        container.className = 'fullscreen-code-container';

        // Zoom out button
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'fullscreen-code-zoom-btn';
        zoomOutBtn.title = 'Zoom out';
        zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';

        // Zoom indicator
        const zoomIndicator = document.createElement('span');
        zoomIndicator.className = 'fullscreen-code-zoom-indicator';

        // Zoom in button
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'fullscreen-code-zoom-btn';
        zoomInBtn.title = 'Zoom in';
        zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';

        // Copy button inside fullscreen
        const copyBtn = document.createElement('button');
        copyBtn.className = 'fullscreen-code-copy-btn';
        copyBtn.title = 'Copy code';
        copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'fullscreen-code-close-btn';
        closeBtn.title = 'Exit fullscreen (Esc)';
        closeBtn.innerHTML = '<i class="fas fa-compress"></i> Close';

        // Code content - use innerHTML to preserve syntax highlighting
        const preClone = document.createElement('pre');
        const codeClone = document.createElement('code');
        codeClone.innerHTML = codeElement.innerHTML;
        if (code && code.className) {
          codeClone.className = code.className;
        }
        preClone.appendChild(codeClone);
        preClone.className = 'fullscreen-code-content';

        // Apply initial zoom
        updateFontSize();

        // Zoom handlers
        zoomOutBtn.addEventListener('click', () => {
          currentZoom = Math.max(currentZoom - d.ZOOM_STEP, d.ZOOM_MIN);
          updateFontSize();
        });
        zoomInBtn.addEventListener('click', () => {
          currentZoom = Math.min(currentZoom + d.ZOOM_STEP, d.ZOOM_MAX);
          updateFontSize();
        });

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'fullscreen-code-toolbar';
        toolbar.appendChild(copyBtn);

        const zoomGroup = document.createElement('div');
        zoomGroup.className = 'fullscreen-code-zoom-group';
        zoomGroup.appendChild(zoomOutBtn);
        zoomGroup.appendChild(zoomIndicator);
        zoomGroup.appendChild(zoomInBtn);
        toolbar.appendChild(zoomGroup);

        toolbar.appendChild(closeBtn);

        container.appendChild(toolbar);
        container.appendChild(preClone);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Close handlers
        const closeOverlay = () => {
          document.body.removeChild(overlay);
          document.body.style.overflow = '';
          document.removeEventListener('keydown', escHandler);
        };

        const escHandler = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            closeOverlay();
          }
        };

        closeBtn.addEventListener('click', closeOverlay);
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            closeOverlay();
          }
        });
        document.addEventListener('keydown', escHandler);

        // Copy handler
        copyBtn.addEventListener('click', () => {
          const text = codeElement.textContent || '';
          navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => {
              copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
            }, 1500);
          });
        });
      });

      pre.appendChild(button);
    });
  }

  private static injectStyles(): void {
    if (FullscreenCodeButtonDirective.stylesInjected) {
      return;
    }
    FullscreenCodeButtonDirective.stylesInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      .fullscreen-code-btn {
        position: absolute;
        top: 4px;
        right: 40px;
        display: none;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.9);
        color: #555;
        font-size: 14px;
        cursor: pointer;
        z-index: 10;
        transition: background-color 0.15s ease, color 0.15s ease;
      }

      .fullscreen-code-btn:hover {
        background: #fff;
        color: #000;
        border-color: rgba(0, 0, 0, 0.3);
      }

      pre:hover .fullscreen-code-btn {
        display: flex;
      }

      .fullscreen-code-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .fullscreen-code-container {
        width: 100%;
        max-width: 70vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        background: #1e1e1e;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      }

      @media (max-width: 1400px) {
        .fullscreen-code-container {
          max-width: 80vw;
        }
      }

      @media (max-width: 1024px) {
        .fullscreen-code-container {
          max-width: 90vw;
        }
      }

      .fullscreen-code-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #2d2d2d;
        border-bottom: 1px solid #444;
      }

      .fullscreen-code-zoom-group {
        display: flex;
        align-items: center;
        gap: 2px;
        margin: 0 auto;
      }

      .fullscreen-code-zoom-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: #ddd;
        font-size: 13px;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }

      .fullscreen-code-zoom-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }

      .fullscreen-code-zoom-indicator {
        font-size: 13px;
        font-weight: 600;
        color: #ccc;
        min-width: 36px;
        text-align: center;
      }

      .fullscreen-code-close-btn,
      .fullscreen-code-copy-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: #ddd;
        font-size: 13px;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }

      .fullscreen-code-close-btn:hover,
      .fullscreen-code-copy-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }

      .fullscreen-code-content {
        margin: 0;
        padding: 20px;
        overflow: auto;
        flex: 1;
        background: #1e1e1e;
        color: #d4d4d4;
        line-height: 1.6;
      }
    `;
    document.head.appendChild(style);
  }
}

