import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class LatestSearchClickNotificationService {
  private latestSearchesClickSource = new Subject<string>();
  latestSearchesClickSource$: Observable<string> =
    this.latestSearchesClickSource.asObservable();

  sendMessage(text: string) {
    this.latestSearchesClickSource.next(text);
  }
}
