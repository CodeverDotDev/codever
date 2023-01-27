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


