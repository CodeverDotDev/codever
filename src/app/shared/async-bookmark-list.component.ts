import { Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookmark } from '../core/model/bookmark';
import { Router } from '@angular/router';
import { PersonalBookmarksStore } from '../core/store/personal-bookmarks-store.service';
import { KeycloakService } from 'keycloak-angular';
import { PublicBookmarksStore } from '../public/bookmarks/store/public-bookmarks-store.service';
import { PublicBookmarksService } from '../public/bookmarks/public-bookmarks.service';
import { RateBookmarkRequest, RatingActionType } from '../core/model/rate-bookmark.request';
import { UserData } from '../core/model/user-data';
import { UserDataStore } from '../core/user/userdata.store';

@Component({
    selector: 'app-async-codingmark-list',
    templateUrl: './async-bookmark-list.component.html',
    styleUrls: ['./async-bookmark-list.component.scss']
})
export class AsyncBookmarkListComponent implements OnInit {

    @Input()
    userId: string;

    @Input()
    codingmarks: Observable<Bookmark[]>;

    @Input()
    queryText: string;

    @Input()
    shownSize: number;

    @Input()
    userData: UserData;

    @Output()
    bookmarkDeleted = new EventEmitter<boolean>();

    private router: Router;
    private personalCodingmarksStore: PersonalBookmarksStore;
    private userDataStore: UserDataStore;
    private publicCodingmarksStore: PublicBookmarksStore;
    private publicCodingmarksService: PublicBookmarksService;
    private keycloakService: KeycloakService;

    displayModal = 'none';

    userIsLoggedIn = false;

    constructor(
        private injector: Injector,
    ) {
        this.router = <Router>this.injector.get(Router);
        this.publicCodingmarksStore = <PublicBookmarksStore>this.injector.get(PublicBookmarksStore);
        this.keycloakService = <KeycloakService>this.injector.get(KeycloakService);
        this.publicCodingmarksService = <PublicBookmarksService>this.injector.get(PublicBookmarksService);

        this.keycloakService.isLoggedIn().then(isLoggedIn => {
            if (isLoggedIn) {
                this.userIsLoggedIn = true;
                this.personalCodingmarksStore = <PersonalBookmarksStore>this.injector.get(PersonalBookmarksStore);
                this.userDataStore = <UserDataStore>this.injector.get(UserDataStore);
            }
        });
    }

    ngOnInit(): void {
        this.keycloakService.isLoggedIn().then(isLoggedIn => {
            if (isLoggedIn) {
                this.keycloakService.loadUserProfile().then(keycloakProfile => {
                    this.userId = keycloakProfile.id;
                });
            }
        });
    }

    /**
     *
     * @param codingmark
     */
    gotoDetail(codingmark: Bookmark): void {
        const link = ['./personal/bookmarks', codingmark._id];
        this.router.navigate(link);
    }

    deleteCodingmark(codingmark: Bookmark): void {
        const obs = this.personalCodingmarksStore.deleteCodingmark(codingmark);
        obs.subscribe(() => {
            this.bookmarkDeleted.emit(true);
            const obs2 = this.publicCodingmarksStore.removeCodingmarkFromPublicStore(codingmark);
            const obs3 = this.userDataStore.removeFromLaterReads(codingmark);
        });
    }

    starCodingmark(codingmark: Bookmark): void {
        this.keycloakService.isLoggedIn().then(isLoggedIn => {
            if (!isLoggedIn) {
                this.displayModal = 'block';
            }
        });

        if (this.userId) {
            if (!codingmark.starredBy) {
                codingmark.starredBy = [];
            } else {
                codingmark.starredBy.push(this.userId);
            }
            const rateCodingmarkRequest: RateBookmarkRequest = {
                ratingUserId: this.userId,
                action: RatingActionType.STAR,
                codingmark: codingmark
            }
            this.rateCodingmark(rateCodingmarkRequest);
        }
    }

    unstarCodingmark(codingmark: Bookmark): void {
        if (this.userId) {
            if (!codingmark.starredBy) {
                codingmark.starredBy = [];
            } else {
                const index = codingmark.starredBy.indexOf(this.userId);
                codingmark.starredBy.splice(index, 1);
            }
            const rateCodingmarkRequest: RateBookmarkRequest = {
                ratingUserId: this.userId,
                action: RatingActionType.UNSTAR,
                codingmark: codingmark
            }
            this.rateCodingmark(rateCodingmarkRequest);

        }
    }

    updateLastAccess(codingmark: Bookmark) {
        if (this.userId === codingmark.userId) {
            codingmark.lastAccessedAt = new Date();
            const obs = this.personalCodingmarksStore.updateCodingmark(codingmark);
        }
    }

    private rateCodingmark(rateCodingmarkRequest: RateBookmarkRequest) {
        const isCodingmarkCreatedByRatingUser = this.userId === rateCodingmarkRequest.codingmark.userId;
        if (isCodingmarkCreatedByRatingUser) {
            const obs = this.personalCodingmarksStore.updateCodingmark(rateCodingmarkRequest.codingmark);
        } else {
            const obs = this.publicCodingmarksService.rateCodingmark(rateCodingmarkRequest);
            obs.subscribe(
                res => {
                    this.publicCodingmarksStore.updateCodingmarkInPublicStore(rateCodingmarkRequest.codingmark);
                }
            );
        }
    }

    onLoginClick() {
        this.keycloakService.login();
    }

    onCancelClick() {
        this.displayModal = 'none';
    }

    addToReadLater(codingmark: Bookmark) {
        this.userData.readLater.push(codingmark._id);
        this.userDataStore.updateUserData(this.userData).subscribe();
        this.userDataStore.addToLaterReads(codingmark);
    }

    removeFromReadLater(codingmark: Bookmark) {
        this.userData.readLater = this.userData.readLater.filter(x => x !== codingmark._id);
        this.userDataStore.updateUserData(this.userData).subscribe();
        this.userDataStore.removeFromLaterReads(codingmark);
    }

}
