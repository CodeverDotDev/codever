import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { UserDataResource } from '../../../core/model/user-data-resource.type';
import { Bookmark } from '../../../core/model/bookmark';
import { Note } from '../../../core/model/note';
import { PinnedCollection } from '../../../core/model/collection';
import { AddToHistoryService } from '../../../core/user/add-to-history.service';
import {
  BookmarkShortcutContext,
  MAIN_LINK_SHORTCUT_PRIORITY,
  MainLinkShortcutService,
} from '../../../core/shortcut/main-link-shortcut.service';
import {
  ActivatableType,
  activationHintLabel,
  singleVisibleResource,
} from '../../../core/shortcut/resource-activation.util';
import { FormsModule } from '@angular/forms';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelContent,
} from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { NoteContentComponent } from '../../note-details/note-card-body/note-content.component';
import { BookmarkTextComponent } from '../../bookmark-text/bookmark-text.component';
import { AsyncPipe, SlicePipe, DatePipe } from '@angular/common';
import { HighLightHtmlPipe } from '../../pipe/highlight.no-html-tags.pipe';
import { ResourceTitleFilterPipe } from '../../pipe/resource-title-filter.pipe';

@Component({
  selector: 'app-hotkeys-dialog',
  templateUrl: './hot-keys-dialog.component.html',
  styleUrls: ['./hot-keys-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatDialogTitle,
    FormsModule,
    CdkScrollable,
    MatDialogContent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    RouterLink,
    MatDialogClose,
    MatExpansionPanelContent,
    NoteContentComponent,
    BookmarkTextComponent,
    AsyncPipe,
    SlicePipe,
    DatePipe,
    HighLightHtmlPipe,
    ResourceTitleFilterPipe,
  ],
})
export class HotKeysDialogComponent implements OnInit, OnDestroy {
  userDataResources$: Observable<UserDataResource[]>;
  title: string;
  filterText: '';

  /** Resource types the focused dialog filter can activate with Enter. */
  readonly activatableTypes: ActivatableType[] = [
    'bookmark',
    'note',
    'collection',
  ];

  /** Snapshot of the dialog's resources, kept for shortcut resolution. */
  private resources: UserDataResource[] = [];
  private resourcesSubscription: Subscription;
  private readonly titleFilter = new ResourceTitleFilterPipe();
  private readonly shortcutContext: BookmarkShortcutContext = {
    priority: MAIN_LINK_SHORTCUT_PRIORITY.DIALOG,
    getSingleVisibleBookmark: () => this.singleVisibleBookmark(),
    // Pinned/History dialogs are only shown to signed-in users.
    isUserLoggedIn: () => true,
  };

  constructor(
    private dialogRef: MatDialogRef<HotKeysDialogComponent>,
    public addToHistoryService: AddToHistoryService,
    private mainLinkShortcutService: MainLinkShortcutService,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.userDataResources$ = data.resources$;
    this.title = data.title;
  }

  ngOnInit(): void {
    this.resourcesSubscription = this.userDataResources$.subscribe(
      (resources) => (this.resources = resources || [])
    );
    this.mainLinkShortcutService.register(this.shortcutContext);
  }

  ngOnDestroy(): void {
    this.resourcesSubscription?.unsubscribe();
    this.mainLinkShortcutService.unregister(this.shortcutContext);
  }

  isNote(resource: UserDataResource): resource is Note {
    return resource.type === 'note';
  }

  isCollection(resource: UserDataResource): resource is PinnedCollection {
    return resource.type === 'collection';
  }

  noteDetailsLink(resource: UserDataResource): string {
    const note = resource as Note;
    return note.public
      ? `/notes/${note._id}/details`
      : `/my-notes/${note._id}/details`;
  }

  collectionDetailsLink(resource: UserDataResource): string {
    return `/my-collections/${resource._id}`;
  }

  /**
   * Enter in the focused filter activates the only visible result: a bookmark's
   * main link in a new tab, or a note's or collection's details page in the
   * current tab. In-app navigation closes the dialog, matching the existing
   * note and collection links in this dialog.
   */
  onFilterEnter(): void {
    const resource = this.singleActivatableResource;
    if (!resource) {
      return;
    }
    const outcome = this.mainLinkShortcutService.activateResource(
      resource,
      true,
      this.activatableTypes
    );
    if (outcome === 'navigated') {
      this.dialogRef.close();
    }
  }

  /** Hint label for the focused filter, or null when Enter would do nothing. */
  get filterActivationHint(): ActivatableType | null {
    return activationHintLabel(this.singleActivatableResource);
  }

  /** The single activatable resource after filtering, or null. */
  private get singleActivatableResource(): UserDataResource | null {
    return singleVisibleResource(
      this.filteredResources(),
      this.activatableTypes
    );
  }

  /** The single visible bookmark after filtering, or null when ambiguous. */
  private singleVisibleBookmark(): Bookmark | null {
    return singleVisibleResource(this.filteredResources(), [
      'bookmark',
    ]) as Bookmark | null;
  }

  /** The dialog's resources after the title filter. */
  private filteredResources(): UserDataResource[] {
    return this.titleFilter.transform(this.resources, this.filterText);
  }
}
