// filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { Search } from '../../core/model/user-data';

@Pipe({name: 'searchFilter'})
export class SearchFilterPipe implements PipeTransform {
  /**
   * Searches in, searches out that are of type 'recent|saved' and given searchDomain('my-bookmarks|public-bookmarks|my-snippets')
   *
   */
  transform(searches: Search[], type: string, searchDomain: string): Search[] {
    if (!searches) {
      return [];
    }
    if (type === 'recent') {
      return searches.filter(search => search.searchDomain === searchDomain).slice(0, 30);
    } else if (type === 'saved') {
      return searches.filter(search => search.saved === true && search.searchDomain === searchDomain);
    }
  }
}
