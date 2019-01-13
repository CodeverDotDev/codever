
import {Injectable} from '@angular/core';
import {Codingmark} from './model/codingmark';
import {List} from 'immutable';
import {Observable} from 'rxjs';

@Injectable()
export class BookmarkFilterService {

  /**
   * Filters a list of bookmarks based on the query string.
   *
   * Tags are enclosed in square brackets - e.g [angular]. The filter is now permissive, that is when starting with
   * "[" the filter assumes that the tag is what comes after even though there is no enclosing "]". That is now to support
   * the autosearch feature
   *
   * @param query - is a string of search terms; multiple terms are separated via the "+" sign
   * @param observableListBookmark - the list to be filtered
   * @returns {any} - the filtered list
   */
  filterBookmarksBySearchTerm(query: string, language: string, observableListBookmark: Observable<List<Codingmark>>): Codingmark[] {

    const searchedTermsAndTags: [string[], string[]] = this.splitSearchQuery(query);
    const searchedTerms: string[] = searchedTermsAndTags[0];
    const searchedTags: string[] = searchedTermsAndTags[1];
    let result: Codingmark[] = [];

    observableListBookmark.subscribe(
      bookmarks => {
        let filteredBookmarks = bookmarks.toArray(); // we start with all bookmarks
        if (language && language !== 'all') {
          filteredBookmarks = filteredBookmarks.filter( x => x.language === language);
        }
        searchedTags.forEach(tag => {
          filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsTag(x, tag));
        });
        searchedTerms.forEach(term => {
          filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsSearchedTerm(x, term.trim()));
        });

        result = filteredBookmarks;
      },
      err => {
        console.log('Error filtering bookmakrs');
      }
    );

    return result;
  }

  /**
   * It will parse the search query and returns the search terms and tags to filter.
   * It is permissive, in the sense that "[angul" is seen as the "angul" tag - needed for autocomplete
   * To see what should come out check the filter.service.spec.ts test examples
   *
   * @param query to be parsed
   * @returns a tuple of terms (first element) and tags (second element)
   */
  public splitSearchQuery(query: string): [string[], string[]]{

    const result: [string[], string[]] = [[], []];

    const terms: string[] = [];
    let term = '';
    const tags: string[] = [];
    let tag = '';

    let isInsideTerm = false;
    let isInsideTag = false;


    for (let i = 0; i < query.length; i++ ) {
      const currentCharacter = query[i];
      if (currentCharacter === ' ') {
        if (!isInsideTag) {
          if (!isInsideTerm) {
            continue;
          } else {
            terms.push(term);
            isInsideTerm = false;
            term = '';
          }
        } else {
          tag += ' ';
        }
      } else if (currentCharacter === '[') {
        if (isInsideTag) {
          tags.push(tag.trim());
          tag = '';
        } else {
          isInsideTag = true;
        }
      } else if (currentCharacter === ']') {
        if (isInsideTag) {
          isInsideTag = false;
          tags.push(tag.trim());
          tag = '';
        }
      } else {
        if (isInsideTag) {
          tag += currentCharacter;
        } else {
          isInsideTerm = true;
          term += currentCharacter;
        }
      }
    }

    if (tag.length > 0) {
      tags.push(tag.trim());
    }

    if (term.length > 0) {
      terms.push(term);
    }

    result[0] = terms;
    result[1] = tags;

    return result;
  }

  /**
   * Checks if one search term is present in the bookmark's metadata (name, location, description, tags)
   * There is still an internal debate to use the contains method (less restrictive) and the
   * RegExp with matching words (more restrictive and does not support propery Unicode)
   *
   * @param bookmark
   * @param searchedTerm
   * @returns {boolean}
   */
  private bookmarkContainsSearchedTerm(codingmark: Codingmark, searchedTerm: string): boolean {
    let result = false;
    const pattern = new RegExp('\\b' + searchedTerm.toLowerCase() + '\\b');
/*    if (bookmark.name.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.location.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.description.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.tags.indexOf(term.toLowerCase()) !== -1
    ) {*/
      if ((codingmark.name && pattern.test(codingmark.name.toLowerCase()))
        || (codingmark.location && pattern.test(codingmark.location.toLowerCase()))
        || (codingmark.location.toLowerCase().indexOf(searchedTerm.toLowerCase()) !== -1) // enables search of entire url "/" is not caught in regex as not word character
        || (codingmark.description && pattern.test(codingmark.description.toLowerCase()))
      ) {
        result = true;
      }

    if (result) {
      return true;
    } else {
      // if not found already look through the tags also
      codingmark.tags.forEach(tag => {
        if (pattern.test(tag.toLowerCase())) {
          result = true;
        }
      });
    }

    return result;
  }

  private bookmarkContainsTag(codingmark: Codingmark, tag: string): boolean {
    let result = false;
    // const pattern = new RegExp('\\b' + tag.toLowerCase() + '\\b');
    const pattern = new RegExp('\s' + tag.toLowerCase() + '\s');
    codingmark.tags.forEach(bookmarkTag => {
      // if (bookmarkTag.toLowerCase().indexOf(tag.toLowerCase()) !== -1){
       if (bookmarkTag.toLowerCase() === tag.toLowerCase()) {
      // if (pattern.test(bookmarkTag.toLowerCase())) {
        result = true;
      }
    });

    return result;
  }

}
