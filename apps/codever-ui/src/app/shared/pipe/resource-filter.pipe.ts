// resource-filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';
import { UserDataResource } from '../../core/model/user-data-resource.type';

@Pipe({ name: 'resourceFilter' })
export class ResourceFilterPipe implements PipeTransform {
  /**
   * Filters a list of resources (bookmarks and/or notes), keeping those that
   * contain every term in the filter text.
   */
  transform(
    resources: UserDataResource[],
    filterText: string
  ): UserDataResource[] {
    if (!resources) {
      return [];
    }
    if (!filterText) {
      return resources;
    }

    return resources.filter((resource) =>
      this.resourceMatchesAllTerms(resource, filterText)
    );
  }

  private resourceMatchesAllTerms(
    resource: UserDataResource,
    filterText: string
  ): boolean {
    const terms = filterText.toLocaleLowerCase().split(' ');
    return terms.every((term) => this.resourceMatchesTerm(resource, term));
  }

  private resourceMatchesTerm(
    resource: UserDataResource,
    term: string
  ): boolean {
    return this.searchableFields(resource).some((field) =>
      field?.toLocaleLowerCase().includes(term)
    );
  }

  /**
   * Text fields to match against. Bookmarks expose `name`/`location`/
   * `description`; notes expose `title`/`content`. Tags apply to both.
   */
  private searchableFields(resource: UserDataResource): string[] {
    const bookmark = resource as Bookmark;
    const note = resource as Note;
    return [
      bookmark.name,
      bookmark.location,
      bookmark.description,
      note.title,
      note.content,
      ...(resource.tags || []),
    ];
  }
}
