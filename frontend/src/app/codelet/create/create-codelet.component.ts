import { Component, Input, OnInit } from '@angular/core';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-new-personal-bookmark-form',
  templateUrl: './create-codelet.component.html',
  styleUrls: ['./create-codelet.component.scss']
})
export class CreateCodeletComponent implements OnInit {

  title; // value of "title" query parameter if present
  code; // value of "desc" query parameter if present
  sourceUrl; // value of "url" query parameter if present
  popup; // value of "url" query parameter if present
  tagsStr; // value of "tags" query parameter if present
  comment; // value of "comment" query parameter if present

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.title = this.route.snapshot.queryParamMap.get('title');
    this.code = this.route.snapshot.queryParamMap.get('code');
    this.sourceUrl = this.route.snapshot.queryParamMap.get('sourceUrl');
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.tagsStr = this.route.snapshot.queryParamMap.get('tags');
    this.comment = this.route.snapshot.queryParamMap.get('comment');
  }

}


