* correct dashboard / saved searches
* remove to-dos (mostly commented code)
* redo gifs
* add + to searching and exact phrase
  * add extensive integration tests for search
* verify "copy snippet" and show more for (longer snippets see https://www.codever.dev/?q=angular%20custom%20route&sd=my-snippets&page=1&tab=search-results)
* remove duplicate code in search services (OR search mode)
* 
* verify for bookmarks
  <button *ngIf="snippet.public || (!snippet.public && snippet.userId === observables.userId)"
  class="btn btn-light btn-sm float-right"
  title="Share via email or on social media"
  (click)="shareSnippetDialog(snippet, observables.userIsLoggedIn, observables.userId)"><i class="fas fa-share"></i> Share
  </button>

* error userinfo in console network when NOT logged in http://localhost:4200/snippets/shared/0a77563c-afed-4b01-af83-52348653e844

* public snippets test not working - see console (results are present but not shown and public bookmarks are searched in...)
