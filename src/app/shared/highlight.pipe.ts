

import {Pipe} from "@angular/core/src/metadata/directives";
import {PipeTransform} from "@angular/core";

@Pipe({ name: 'highlight' })
export class HighLightPipe implements PipeTransform {

  //piece of code taken from https://gist.github.com/adamrecsko/0f28f474eca63e0279455476cc11eca7 (thank you andrei)
  transform(text: string, search): string {
    var terms = search.split("+");
    var result = text;
    terms.forEach(term => {
      var pattern = term.trim().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      pattern = pattern.split(' ').filter((t) => {
        return t.length > 0;
      }).join('|');
      var regex = new RegExp(pattern, 'gi');

      result = term ? result.replace(regex, (match) => `<span class="highlight">${match}</span>`) : result;
    });

    return result;
  }

}
