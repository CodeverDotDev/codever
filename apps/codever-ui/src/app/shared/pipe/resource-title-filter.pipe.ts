import { Pipe, PipeTransform } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';
import { PinnedCollection } from '../../core/model/collection';
import { UserDataResource } from '../../core/model/user-data-resource.type';

@Pipe({ name: 'resourceTitleFilter' })
export class ResourceTitleFilterPipe implements PipeTransform {
  transform(
    resources: UserDataResource[],
    filterText: string
  ): UserDataResource[] {
    if (!resources || !filterText?.trim()) {
      return resources || [];
    }

    const normalizedFilterText = filterText.toLocaleLowerCase().trim();
    return resources.filter((resource) => {
      const title = this.title(resource).toLocaleLowerCase();
      return title.includes(normalizedFilterText);
    });
  }

  private title(resource: UserDataResource): string {
    if ((resource as PinnedCollection).type === 'collection') {
      return (resource as PinnedCollection).name || '';
    }
    return resource.type === 'note'
      ? (resource as Note).title || ''
      : (resource as Bookmark).name || '';
  }
}
