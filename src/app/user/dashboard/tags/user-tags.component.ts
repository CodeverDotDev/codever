import { Component, Input, OnInit } from '@angular/core';
import { UsedTag, UsedTags } from '../../../core/model/used-tag';
import { UserDataService } from '../../../core/user-data.service';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { DeleteBookmarksByTagDialogComponent } from './delete-bookmarks-by-tag-dialog/delete-bookmarks-by-tag-dialog.component';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';

@Component({
  selector: 'app-user-tags',
  templateUrl: './user-tags.component.html',
  styleUrls: ['./user-tags.component.scss']
})
export class UserTagsComponent implements OnInit {


  usedTags$: Observable<UsedTags>;

  selectTagControl = new FormControl();

  options: UsedTag[] = [];
  filteredOptions: Observable<UsedTag[]>;

  @Input()
  userId: string;

  private buttonEnabled: boolean;

  constructor(
    private deleteDialog: MatDialog,
    private userDataService: UserDataService,
    private personaBookmarksService: PersonalBookmarksService) {
  }

  ngOnInit() {
    this.usedTags$ = this.userDataService.getUsedTags(this.userId);
    this.usedTags$.subscribe(usedTags => {
      this.options = usedTags.private;
    });

    this.filteredOptions = this.selectTagControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.name),
        map(name => name ? this._filter(name) : this.options.slice())
      );

    this.selectTagControl.valueChanges.subscribe(value => {
      this.buttonEnabled = this.options.map(option => {
        return option.name
      }).includes(value.name);
    })
  }

  displayTag(usedTag?: UsedTag): string | undefined {
    return usedTag ? `${usedTag.name}` : undefined;
  }

  private _filter(name: string): UsedTag[] {
    const filterValue = name.toLowerCase();

    return this.options.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
  }

  deletePrivateBookmarksByTag(value: string) {
    console.log('DELETED all private tags for value ', value)
  }

  openDeleteDialog(tag: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      tag: tag
    };

    console.log(dialogConfig.data);

    const dialogRef = this.deleteDialog.open(DeleteBookmarksByTagDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        if (data === 'DELETE_CONFIRMED') {
          this.deletePrivateBookmarksForTag(tag);
        }
      }
    );
  }

  deletePrivateBookmarksForTag(tag: string): void {
    this.personaBookmarksService.deletePrivateBookmarksForTag(this.userId, tag).subscribe(() => {
      console.log('Private bookmarks deleted for tag - ', tag);
      window.location.reload();
    });
  }
}
