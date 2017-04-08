

import {Pipe} from "@angular/core";
import {PipeTransform} from "@angular/core";

@Pipe({ name: 'highlightHtml' })
export class HighLightHtmlPipe implements PipeTransform {

  transform(text: string, search): string {
    var pattern = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    pattern = pattern.split(' ').filter((t) => {
      return t.length > 0;
    }).join('|');
    //pattern = '(' + pattern + ')' + '(?![^<]*>|[<>]*</)';
    //pattern = '(' + pattern + ')' + '(?![^<]*>|[<>]*<\/)';
    pattern = '(' + pattern + ')' + '(?![^<]*>)';
    var regex = new RegExp(pattern, 'gi');

    return search ? text.replace(regex, (match) => `<span class="highlight">${match}</span>`) : text;
  }

}
