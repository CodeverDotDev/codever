import { Pipe } from '@angular/core';
import { PipeTransform } from '@angular/core';

import * as showdown from 'showdown';

const converter = new showdown.Converter();

@Pipe({name: 'md2html'})
export class Markdown2HtmlPipe implements PipeTransform {
  transform(text: string): string {
    return converter.makeHtml(text)
  }
}

