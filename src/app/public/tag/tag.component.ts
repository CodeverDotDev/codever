
import {map} from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import {TagService} from './tag.service';
import {ActivatedRoute} from '@angular/router';
import {Codingmark} from '../../core/model/codingmark';
import {Observable} from 'rxjs';
import {UserDataStore} from '../../core/user/userdata.store';
import {KeycloakService} from 'keycloak-angular';
import {UserData} from '../../core/model/user-data';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.css']
})
export class TagComponent implements OnInit {

  bookmarksForTag$: Observable<Codingmark[]>;
  tag: string;
  userData: UserData;
  counter = 30;

  constructor(private tagService: TagService,
              private userDataStore: UserDataStore,
              private keycloakService: KeycloakService,
              private route: ActivatedRoute) { }

  ngOnInit() {
    this.tag = this.route.snapshot.params['tag'];
    if (this.tag) {
      this.bookmarksForTag$ = this.tagService.getBookmarksForTag(this.tag);
    } else if (this.route.snapshot.url.length > 1) {
      console.log('page not found');

    } else {
      this.tag = this.route.snapshot.url[0].path;
      this.bookmarksForTag$ = this.tagService.getBookmarksForTag(this.tag);
    }


    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userDataStore.getUserData().subscribe(data => {
              this.userData = data;
            },
            error => {
            }
          );
        });
      }
    });
  }

  showMoreResults() {
    this.counter += 10;
  }

}
