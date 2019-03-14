import { Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Codingmark } from '../core/model/codingmark';
import { Router } from '@angular/router';
import { PersonalCodingmarksStore } from '../core/store/personal-codingmarks-store.service';
import { KeycloakService } from 'keycloak-angular';
import { PublicCodingmarksStore } from '../public/codingmark/store/public-codingmarks-store.service';
import { PublicCodingmarksService } from '../public/codingmark/public-codingmarks.service';
import { RateCodingmarkRequest, RatingActionType } from '../core/model/rate-codingmark.request';
import { UserData } from '../core/model/user-data';
import { UserDataStore } from '../core/user/userdata.store';

@Component({
    selector: 'app-async-codingmark-list',
    templateUrl: './async-codingmark-list.component.html',
    styleUrls: ['./async-codingmark-list.component.scss']
})
export class AsyncCodingmarkListComponent implements OnInit {

    @Input()
    userId: string;

    @Input()
    codingmarks: Observable<Codingmark[]>;

    @Input()
    queryText: string;

    @Input()
    shownSize: number;

    @Input()
    userData: UserData;

    @Output()
    bookmarkDeleted = new EventEmitter<boolean>();

    private router: Router;
    private personalCodingmarksStore: PersonalCodingmarksStore;
    private userDataStore: UserDataStore;
    private publicCodingmarksStore: PublicCodingmarksStore;
    private publicCodingmarksService: PublicCodingmarksService;
    private keycloakService: KeycloakService;

    displayModal = 'none';

    userIsLoggedIn = false;

    constructor(
        private injector: Injector,
    ) {
        this.router = <Router>this.injector.get(Router);
        this.publicCodingmarksStore = <PublicCodingmarksStore>this.injector.get(PublicCodingmarksStore);
        this.keycloakService = <KeycloakService>this.injector.get(KeycloakService);
        this.publicCodingmarksService = <PublicCodingmarksService>this.injector.get(PublicCodingmarksService);

        this.keycloakService.isLoggedIn().then(isLoggedIn => {
            if (isLoggedIn) {
                this.userIsLoggedIn = true;
                this.personalCodingmarksStore = <PersonalCodingmarksStore>this.injector.get(PersonalCodingmarksStore);
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
    gotoDetail(codingmark: Codingmark): void {
        const link = ['./personal/codingmarks', codingmark._id];
        this.router.navigate(link);
    }

    deleteCodingmark(codingmark: Codingmark): void {
        const obs = this.personalCodingmarksStore.deleteCodingmark(codingmark);
        obs.subscribe(() => {
            this.bookmarkDeleted.emit(true);
            const obs2 = this.publicCodingmarksStore.removeCodingmarkFromPublicStore(codingmark);
            const obs3 = this.userDataStore.removeFromLaterReads(codingmark);
        });
    }

    starCodingmark(codingmark: Codingmark): void {
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
            const rateCodingmarkRequest: RateCodingmarkRequest = {
                ratingUserId: this.userId,
                action: RatingActionType.STAR,
                codingmark: codingmark
            }
            this.rateCodingmark(rateCodingmarkRequest);
        }
    }

    unstarCodingmark(codingmark: Codingmark): void {
        if (this.userId) {
            if (!codingmark.starredBy) {
                codingmark.starredBy = [];
            } else {
                const index = codingmark.starredBy.indexOf(this.userId);
                codingmark.starredBy.splice(index, 1);
            }
            const rateCodingmarkRequest: RateCodingmarkRequest = {
                ratingUserId: this.userId,
                action: RatingActionType.UNSTAR,
                codingmark: codingmark
            }
            this.rateCodingmark(rateCodingmarkRequest);

        }
    }

    updateLastAccess(codingmark: Codingmark) {
        if (this.userId === codingmark.userId) {
            codingmark.lastAccessedAt = new Date();
            const obs = this.personalCodingmarksStore.updateCodingmark(codingmark);
        }
    }

    private rateCodingmark(rateCodingmarkRequest: RateCodingmarkRequest) {
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

    addToReadLater(codingmark: Codingmark) {
        this.userData.readLater.push(codingmark._id);
        this.userDataStore.updateUserData(this.userData).subscribe();
        this.userDataStore.addToLaterReads(codingmark);
    }

    removeFromReadLater(codingmark: Codingmark) {
        this.userData.readLater = this.userData.readLater.filter(x => x !== codingmark._id);
        this.userDataStore.updateUserData(this.userData).subscribe();
        this.userDataStore.removeFromLaterReads(codingmark);
    }

}
