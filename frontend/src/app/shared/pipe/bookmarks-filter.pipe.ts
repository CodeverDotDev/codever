// filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';

@Pipe({name: 'bookmarkFilter'})
export class BookmarksFilterPipe implements PipeTransform {
  /**
   * Bookmarks in, bookmarks out that contain all the terms in the filterText
   *
   * @param {Bookmark[]} bookmarks
   * @param {string} filterText
   * @returns {Bookmark[]}
   */
  transform(bookmarks: Bookmark[], filterText: string): Bookmark[] {
    if (!bookmarks) {
      return [];
    }
    if (!filterText) {
      return bookmarks;
    }

    return bookmarks.filter(bookmark => {
      return this.bookmarkContainsFilterText(bookmark, filterText);
    });
  }

  private bookmarkContainsFilterText(bookmark: Bookmark, filterText): boolean {
    filterText = filterText.toLocaleLowerCase();
    const filterTerms = filterText.split(' ');
    for (const filterTerm of filterTerms) {
      const hasFilterTerm = this.bookmarkContainsFilterTerm(bookmark, filterTerm);
      if (hasFilterTerm === false) {
        return false;
      }
    }

    return true;
  }

  private tagsHaveFilterText(tags: string[], filterText: string): boolean {
    for (const tag of tags) {
      if (tag.includes(filterText)) {
        return true;
      }
    }

    return false;
  }

  private bookmarkContainsFilterTerm(bookmark: Bookmark, filterTerm: string) {
    return bookmark.name.toLocaleLowerCase().includes(filterTerm)
      || bookmark.location.toLocaleLowerCase().includes(filterTerm)
      || bookmark.description.toLocaleLowerCase().includes(filterTerm)
      || this.tagsHaveFilterText(bookmark.tags, filterTerm);
  }
}
