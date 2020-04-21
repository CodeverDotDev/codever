import { Pipe } from '@angular/core';
import { PipeTransform } from '@angular/core';

import * as showdown from 'showdown';

const converter = new showdown.Converter();

/**
 * Angular doc - https://angular.io/guide/pipes
 */
@Pipe({name: 'md2html'})
export class Markdown2HtmlPipe implements PipeTransform {

  // piece of code taken from https://gist.github.com/adamrecsko/0f28f474eca63e0279455476cc11eca7 (thank you andrei)
  transform(text: string): string {
    return converter.makeHtml(text)
  }
}

