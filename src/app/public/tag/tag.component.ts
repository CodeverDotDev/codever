
import {map} from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import {TagService} from './tag.service';
import {ActivatedRoute} from '@angular/router';
import {Codingmark} from '../../core/model/codingmark';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.css']
})
export class TagComponent implements OnInit {

  bookmarksForTag$: Observable<Codingmark[]>;
  tag: string;
  queryText: string;
  counter = 10;

  constructor(private tagService: TagService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.pipe(
      map(params => params['tag']))
      .subscribe((tag) => {
          this.tag = tag;
          this.queryText = '[' + tag + ']';
          this.bookmarksForTag$ = this.tagService.getBookmarksForTag(tag);
      });
  }

  showMoreResults() {
    this.counter += 10;
  }

}
