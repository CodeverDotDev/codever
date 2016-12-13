
import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {List} from 'immutable';
import {Bookmark} from "../../model/bookmark";
import {Logger} from "../../logger.service";
import {ErrorService} from "../../error/error.service";
import {Response} from "@angular/http";
import {UserBookmarkService} from "../user-bookmark.service";
import {KeycloakService} from "../../keycloak/keycloak.service";

@Injectable()
export class UserBookmarkStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]))

    private userId: String;

    constructor(private userBookmarkService: UserBookmarkService,
                private logger:Logger,
                private errorService: ErrorService,
                private keycloakService: KeycloakService) {
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
          console.log(res.json());
          let bookmarks = (<Object[]>res.json())
            .map((bookmark: any) =>
              new Bookmark(
                  bookmark.name,
                  bookmark.location,
                  bookmark.category,
                  bookmark.tags,
                  bookmark.description,
                  bookmark._id,
                  '',
                  bookmark.userId,
                  bookmark.shared
              )
            );

          this._bookmarks.next(List(bookmarks));
        },
        err => console.log("Error retrieving bookmarks")
      );
  }

  getBookmarks():Observable<List<Bookmark>> {
      return this._bookmarks.asObservable();
  }

  addBookmark(userId:string, newBookmark:Bookmark):Observable<List<Bookmark>> {

    let obs = this.userBookmarkService.saveBookmark(userId, newBookmark);

    obs.subscribe(
      res => {
        let headers = res.headers;
        //get the bookmark id, which lies in the "location" response header
        let lastSlashIndex = headers.get('location').lastIndexOf('/');
        let newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
        newBookmark._id = newBookmarkId;
        this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
      },
      (error: Response) => {
        this.errorService.handleError(error.json());
        return Observable.throw(error.json());
      }
    );

    return Observable.of(this._bookmarks);
  }

  deleteBookmark(deleted: Bookmark): Observable<any> {
    let obs: Observable<any> = this.userBookmarkService.delete(deleted);

    obs.subscribe(
      res =>  {
        let bookmarks: List<Bookmark> = this._bookmarks.getValue();
        let index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        console.log('DELETED INDEEEX ' + index);
        this._bookmarks.next(bookmarks.delete(index));
        console.log(bookmarks);
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
        //let bookmark:Bookmark = bookmarks.get(index);
        this._bookmarks.next(bookmarks.set(index, updated));
      }
    );

    return obs;
  }

  getBookmark(id:string): Bookmark{
    let bookmarks = this._bookmarks.getValue();
    let index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === id);

    return bookmarks.get(index);
  }

  filterBookmarksBySearchTerm(term:string): Bookmark[] {
    let bookmarks: List<Bookmark> = this._bookmarks.getValue();
    let filteredBookmarks: Array<Bookmark> = new Array();
    bookmarks.forEach(bookmark => {
      let hit:boolean =false;
      if(bookmark.name.toLowerCase().indexOf(term.toLowerCase()) !== -1
        || bookmark.description.toLowerCase().indexOf(term.toLowerCase()) !== -1
        || bookmark.category.toLowerCase().indexOf(term.toLowerCase()) !== -1
        || bookmark.tags.indexOf(term.toLowerCase()) !== -1
      ){
        filteredBookmarks.push(bookmark);
        hit = true;
      }

      //if not hit look throught the tags also
      let hitInTags: boolean = false;
      if(!hit){
        bookmark.tags.forEach(tag => {
          if(tag.indexOf(term.toLowerCase()) !== -1){
            hitInTags = true;
          }
        });
      }

      if(!hit && hitInTags){
        filteredBookmarks.push(bookmark);
      }
    });

    let  filteredBookmarksArray: Array<Array<Bookmark>> = new Array();
    filteredBookmarksArray.push(filteredBookmarks);

    console.log('I have been here, size ' + filteredBookmarks.length);

    return filteredBookmarks;
  }

}

