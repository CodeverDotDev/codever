
import {Pipe} from '@angular/core';
import {PipeTransform} from '@angular/core';

@Pipe({ name: 'highlight' })
export class HighLightPipe implements PipeTransform {

  // piece of code taken from https://gist.github.com/adamrecsko/0f28f474eca63e0279455476cc11eca7 (thank you andrei)
  transform(text: string, search): string {
    search = search.replace(/[\[\]]/g, '');
    let pattern = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    pattern = pattern.split(' ').filter((t) => {
      return t.length > 0;
    }).join('|');

    const regex = new RegExp(pattern, 'gi');

    return search ? text.replace(regex, (match) => `<span class="highlight">${match}</span>`) : text;
  }

}
