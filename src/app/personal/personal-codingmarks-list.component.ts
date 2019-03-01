
import {map} from 'rxjs/operators';
import {Component, OnInit} from '@angular/core';
import {Codingmark} from '../core/model/codingmark';
import {Observable} from 'rxjs';
import {List} from 'immutable';
import {PersonalCodingmarksStore} from '../core/store/personal-codingmarks-store.service';
import {ActivatedRoute, Router} from '@angular/router';
import {UserData} from '../core/model/user-data';
import {UserDataStore} from '../core/user/userdata.store';
import {UserService} from '../core/user.service';
import {MatTabChangeEvent} from '@angular/material';

@Component({
  selector: 'app-user-codingmarks',
  templateUrl: './personal-codingmarks-list.component.html',
  styleUrls: ['./personal-codingmarks-list.component.scss']
})
export class PersonalCodingmarksListComponent implements OnInit {

  personalCodingmarks$: Observable<List<Codingmark>>;
  laterReads$: Observable<Codingmark[]>;
  query = '';
  userData: UserData;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personalCodingmarksStore: PersonalCodingmarksStore,
    private userDataStore: UserDataStore,
    private userService: UserService) { }

  ngOnInit(): void {
    this.query = this.route.snapshot.queryParamMap.get('q');
    if (this.query) {
      this.query = this.query.replace(/\+/g,  ' ');
    } else {
      this.query = this.route.snapshot.queryParamMap.get('search');
      if (this.query) {
        this.query = this.query.replace(/\+/g,  ' ');
      }
    }
    this.personalCodingmarks$ = this.personalCodingmarksStore.getPersonalCodingmarks();
    this.userDataStore.getUserData().subscribe(data => {
        this.userData = data;
        //this.laterReads$ = this.userService.getLaterReads(this.userData.userId);
      },
      error => {
      }
    );
  }

  goToAddNewPersonalBookmark(): void {
    const link = ['./new'];
    this.router.navigate(link, { relativeTo: this.route });
  }

  tabSelectionChanged(event: MatTabChangeEvent) {

    if(event.index == 1) {
      console.log("selected read later");
      this.laterReads$ = this.userService.getLaterReads(this.userData.userId);
    }
  }
}
