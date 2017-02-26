
import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {List} from 'immutable';
import {Bookmark} from "../../model/bookmark";
import {Logger} from "../../logger.service";
import {ErrorService} from "../../error/error.service";
import {Response} from "@angular/http";
import {UserBookmarkService} from "../user-bookmark.service";
import {KeycloakService} from "../../keycloak/keycloak.service";
import {BookmarkStore} from "../../bookmark/store/BookmarkStore";

@Injectable()
export class UserBookmarkStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]));

    private userId: String;

    constructor(private userBookmarkService: UserBookmarkService,
                private logger:Logger,
                private errorService: ErrorService,
                private keycloakService: KeycloakService,
                private bookmarkStore: BookmarkStore
    ) {
        this.logger.log('******** UserBookmarkStore constructor was called *************');
        const keycloak = keycloakService.getKeycloak();
        if(keycloak) {
          this.userId = keycloak.subject;
        }
        this.loadInitialData();
    }

  private loadInitialData() {
    this.logger.log('******** UserBookmarkStore.loadInitial was called *************');
    this.userBookmarkService.getAllBookmarks(this.userId)
      .subscribe(
        res => {
          let bookmarks = (<Object[]>res.json())
            .map((bookmark: any) =>
              new Bookmark(
                  bookmark.name,
                  bookmark.location,
                  bookmark.category,
                  bookmark.tags,
                  bookmark.description,
                  bookmark.descriptionHtml,
                  bookmark._id,
                  '',
                  bookmark.userId,
                  bookmark.shared
              )
            );

          this._bookmarks.next(List(bookmarks));
        },
        err => console.error("Error retrieving bookmarks", err)
      );
  }

  getBookmarks():Observable<List<Bookmark>> {
      return this._bookmarks.asObservable();
  }

  addBookmark(userId:string, newBookmark:Bookmark):Observable<any> {

    let obs = this.userBookmarkService.saveBookmark(userId, newBookmark);

    obs.subscribe(
      res => {
        let headers = res.headers;
        //get the bookmark id, which lies in the "location" response header
        let lastSlashIndex = headers.get('location').lastIndexOf('/');
        let newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
        newBookmark._id = newBookmarkId;
        //this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
        this._bookmarks.next(this._bookmarks.getValue().unshift(newBookmark));

        if(newBookmark.shared){
          this.bookmarkStore.addBookmark(newBookmark);
        }
      },
      (error: Response) => {
        this.errorService.handleError(error.json());
        return Observable.throw(error.json());
      }
    );

    return obs;
  }

  deleteBookmark(deleted: Bookmark): Observable<any> {
    let obs: Observable<any> = this.userBookmarkService.delete(deleted);

    obs.subscribe(
      res =>  {
        let bookmarks: List<Bookmark> = this._bookmarks.getValue();
        let index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        console.log('DELETED INDEEEX ' + index);
        var listWithoutElement = bookmarks.delete(index);
        this._bookmarks.next(listWithoutElement);
        listWithoutElement.forEach(bookmark => {
          console.log(bookmark);
        });

        if(deleted.shared) {
          this.bookmarkStore.removeFromStore(deleted);
        }
      }
    );

    return obs;
  }

  updateBookmark(updated:Bookmark): Observable<any> {
    let obs: Observable<any> = this.userBookmarkService.updateBookmark(updated);

    obs.subscribe(
      res => {
        let bookmarks = this._bookmarks.getValue();
        let index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
        this._bookmarks.next(bookmarks.delete(index).unshift(updated)); //move the updated bookmark to the top of the list, to immediately see the results

        if(updated.shared){
          this.bookmarkStore.updateBookmark(updated);
        }
      }
    );

    return obs;
  }

  getBookmark(id:string): Bookmark{
    let bookmarks = this._bookmarks.getValue();
    let index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === id);

    return bookmarks.get(index);
  }

}

