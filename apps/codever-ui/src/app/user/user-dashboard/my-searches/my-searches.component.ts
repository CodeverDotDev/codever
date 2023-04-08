import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DeleteSavedSearchDialogComponent } from './delete-saved-search-dialog/delete-saved-search-dialog.component';
import { Search, UserData } from '../../../core/model/user-data';
import { UserDataStore } from '../../../core/user/userdata.store';
import { SearchDomain } from '../../../core/model/search-domain.enum';
import { searchDomains } from '../../../core/model/search-domains-map';

@Component({
  selector: 'app-saved-searches',
  templateUrl: './my-searches.component.html',
  styleUrls: ['./my-searches.component.scss'],
})
export class MySearchesComponent implements OnInit {
  userData$: Observable<UserData>;
  _userData: UserData;

  selectSavedSearchControl = new UntypedFormControl();

  autocompleteSearches: Search[] = [];
  filteredSearches: Observable<Search[]>;

  @Input()
  userId: string;

  buttonEnabled: boolean;

  searchDomain = SearchDomain.MY_BOOKMARKS.valueOf();
  searchDomains = searchDomains;

  saved = 'saved';
  recent = 'recent';

  constructor(
    private deleteDialog: MatDialog,
    private userDataStore: UserDataStore
  ) {}

  ngOnInit() {
    this.userData$ = this.userDataStore.getUserData$();

    this.userData$.subscribe((userData) => {
      this._userData = userData;
      this.autocompleteSearches = userData.searches;
    });

    this.setFilteredSearches$(this.searchDomain);

    this.selectSavedSearchControl.valueChanges.subscribe((value) => {
      this.buttonEnabled = this.autocompleteSearches.some(
        (e) => e.text === value && e.searchDomain === this.searchDomain
      );
    }); // TODO check this one
  }

  private setFilteredSearches$(searchDomain: string) {
    this.filteredSearches = this.selectSavedSearchControl.valueChanges.pipe(
      startWith(null),
      map((searchText: string | null) => {
        return searchText
          ? this._filter(searchText)
          : this.autocompleteSearches.filter(
              (item) => item.searchDomain === searchDomain
            );
      })
    );
  }

  private _filter(value: string): Search[] {
    const filterValue = value.toLowerCase();

    return this.autocompleteSearches.filter(
      (item) =>
        item.text.toLowerCase().includes(filterValue) &&
        item.searchDomain === this.searchDomain
    );
  }

  openDeleteDialog(savedSearchText: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      savedSearchText: savedSearchText,
      searchDomain: searchDomains.get(this.searchDomain),
    };

    const dialogRef = this.deleteDialog.open(
      DeleteSavedSearchDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((data) => {
      if (data === 'DELETE_CONFIRMED') {
        this.deleteSavedSearch(savedSearchText);
      }
    });
  }

  // TODO group saved searches nach SearchDomain and delete it coresspondingly
  deleteSavedSearch(savedSearchText: string) {
    const index = this._userData.searches.findIndex(
      (search: Search) =>
        search.text === savedSearchText &&
        search.searchDomain === this.searchDomain
    );
    this._userData.searches.splice(index, 1);
    this.userDataStore.updateUserData$(this._userData).subscribe();
  }

  onSearchDomainChange(selectedSearchDomain) {
    this.setFilteredSearches$(selectedSearchDomain);
    this.searchDomain = selectedSearchDomain;
  }
}
