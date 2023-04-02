import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  public logoClicked = new Subject();

  constructor() {}

  clickLogo(logoClicked: boolean) {
    this.logoClicked.next(logoClicked);
  }
}
