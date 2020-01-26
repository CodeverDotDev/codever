import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { DeleteSavedSearchDialogComponent } from './delete-saved-search-dialog/delete-saved-search-dialog.component';
import { Search, UserData } from '../../../core/model/user-data';
import { UserDataStore } from '../../../core/user/userdata.store';

@Component({
  selector: 'app-saved-searches',
  templateUrl: './saved-searches.component.html',
  styleUrls: ['./saved-searches.component.scss']
})
export class SavedSearchesComponent implements OnInit {


  userData$: Observable<UserData>;
  _userData: UserData;

  selectSavedSearchControl = new FormControl();

  options: string[] = [];
  filteredOptions: Observable<string[]>;

  @Input()
  userId: string;

  buttonEnabled: boolean;

  constructor(
    private deleteDialog: MatDialog,
    private userDataStore: UserDataStore) {
  }

  ngOnInit() {
    this.userData$ = this.userDataStore.getUserData$();

    this.userData$.subscribe(userData => {
      this._userData = userData;
      this.options = userData.searches.map(search => search.text);
    });

    this.filteredOptions = this.selectSavedSearchControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );

    this.selectSavedSearchControl.valueChanges.subscribe(value => {
      this.buttonEnabled = this.options.includes(value);
    })
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  openDeleteDialog(savedSearchText: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      savedSearchText: savedSearchText
    };

    const dialogRef = this.deleteDialog.open(DeleteSavedSearchDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        if (data === 'DELETE_CONFIRMED') {
          this.deleteSavedSearch(savedSearchText);
        }
      }
    );
  }

  deleteSavedSearch(savedSearchText: string) {
    const index = this._userData.searches.findIndex((search: Search) => search.text === savedSearchText);
    this._userData.searches.splice(index, 1);
    this.userDataStore.updateUserData(this._userData).subscribe();
  }
}
