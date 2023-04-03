import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button-copy-snippet',
  templateUrl: './copy-snippet-button.component.html',
  styleUrls: ['./copy-snippet-button.component.scss'],
})
export class CopySnippetButtonComponent {
  buttonText = 'Copy snippet';

  @Input()
  codeSnippet: string;

  copyToClipboard() {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.codeSnippet;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    const copyResult = document.execCommand('copy');
    if (copyResult) {
      this.buttonText = 'Copied';
      setTimeout(() => (this.buttonText = 'Copy snippet'), 1300);
    }
    document.body.removeChild(selBox);
  }
}
