import { Component, Input, OnInit } from '@angular/core';
import { Codelet } from '../../core/model/codelet';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-async-codelet-list',
  templateUrl: './async-codelet-list.component.html',
  styleUrls: ['./async-codelet-list.component.scss']
})
export class AsyncCodeletListComponent implements OnInit {

  @Input()
  codelets$: Observable<Codelet[]>;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  constructor(private router: Router) { }

  ngOnInit() {
  }

  of(codelet: Codelet) {
    return of(codelet);
  }
}
