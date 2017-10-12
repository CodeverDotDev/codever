
import {Injectable} from '@angular/core';
import {Bookmark} from './model/bookmark';
import {List} from 'immutable';
import {Observable} from 'rxjs/Observable';

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
  filterBookmarksBySearchTerm(query: string, language: string, observableListBookmark: Observable<List<Bookmark>>): Bookmark[] {

    const termsAndTags: [string[], string[]] = this.splitSearchQuery(query);
    const terms: string[] = termsAndTags[0];
    const tags: string[] = termsAndTags[1];
    let result: Bookmark[] = [];

    observableListBookmark.subscribe(
      bookmarks => {
        let filteredBookmarks = bookmarks.toArray(); // we start with all bookmarks
        if (language && language !== 'all') {
          filteredBookmarks = filteredBookmarks.filter( x => x.language === language);
        }
        tags.forEach(tag => {
          filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsTag(x, tag));
        });
        terms.forEach(term => {
          filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsTerm(x, term.trim()));
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
   * @param term
   * @returns {boolean}
   */
  private bookmarkContainsTerm(bookmark: Bookmark, term: string): boolean {
    let result = false;
    const pattern = new RegExp('\\b' + term.toLowerCase() + '\\b');
/*    if (bookmark.name.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.location.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.description.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.tags.indexOf(term.toLowerCase()) !== -1
    ) {*/
      if ((bookmark.name && pattern.test(bookmark.name.toLowerCase()))
        || (bookmark.location && pattern.test(bookmark.location.toLowerCase()))
        || (bookmark.description && pattern.test(bookmark.description.toLowerCase()))
      ) {
        result = true;
      }

    if (result) {
      return true;
    } else {
      // if not found already look through the tags also
      bookmark.tags.forEach(tag => {
        if (pattern.test(tag.toLowerCase())) {
          result = true;
        }
      });
    }

    return result;
  }

  private bookmarkContainsTag(bookmark: Bookmark, tag: string): boolean {
    let result = false;
    // const pattern = new RegExp('\\b' + tag.toLowerCase() + '\\b');
    const pattern = new RegExp('\s' + tag.toLowerCase() + '\s');
    bookmark.tags.forEach(bookmarkTag => {
      // if (bookmarkTag.toLowerCase().indexOf(tag.toLowerCase()) !== -1){
       if (bookmarkTag.toLowerCase() === tag.toLowerCase()) {
      // if (pattern.test(bookmarkTag.toLowerCase())) {
        result = true;
      }
    });

    return result;
  }

}
