import { AfterViewChecked, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appCopyCodeButton]',
})
export class CopyCodeButtonDirective implements AfterViewChecked {
  private static stylesInjected = false;

  constructor(private el: ElementRef) {
    CopyCodeButtonDirective.injectStyles();
  }

  ngAfterViewChecked(): void {
    const preElements = this.el.nativeElement.querySelectorAll('pre');
    preElements.forEach((pre: HTMLElement) => {
      if (pre.getAttribute('data-copy-btn-added') === 'true') {
        return;
      }

      pre.setAttribute('data-copy-btn-added', 'true');
      pre.style.position = 'relative';

      const button = document.createElement('button');
      button.className = 'copy-code-btn';
      button.title = 'Copy code';
      button.innerHTML = '<i class="far fa-copy"></i>';

      button.addEventListener('click', () => {
        const code = pre.querySelector('code');
        const text = code ? code.textContent : pre.textContent;
        navigator.clipboard.writeText(text || '').then(() => {
          button.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => {
            button.innerHTML = '<i class="far fa-copy"></i>';
          }, 1500);
        });
      });

      pre.appendChild(button);
    });
  }

  private static injectStyles(): void {
    if (CopyCodeButtonDirective.stylesInjected) {
      return;
    }
    CopyCodeButtonDirective.stylesInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      pre[data-copy-btn-added="true"] {
        position: relative;
      }

      .copy-code-btn {
        position: absolute;
        top: 4px;
        right: 4px;
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

      .copy-code-btn:hover {
        background: #fff;
        color: #000;
        border-color: rgba(0, 0, 0, 0.3);
      }

      pre[data-copy-btn-added="true"]:hover .copy-code-btn {
        display: flex;
      }
    `;
    document.head.appendChild(style);
  }
}

