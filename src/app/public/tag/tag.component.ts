import { Component, OnInit } from '@angular/core';
import {TagService} from './tag.service';
import {ActivatedRoute} from '@angular/router';
import {Bookmark} from '../../core/model/bookmark';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.css']
})
export class TagComponent implements OnInit {

  bookmarksForTag: Observable<Bookmark[]>;
  tag: string;
  queryText: string;

  constructor(private tagService: TagService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params
      .map(params => params['tag'])
      .subscribe((tag) => {
          this.tag = tag;
          this.queryText = '[' + tag + ']';
          this.bookmarksForTag = this.tagService.getBookmarksForTag(tag);
      });
  }

}
