import { Component, OnInit } from '@angular/core';
import { Logger } from '../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-new-personal-bookmark-form',
  templateUrl: './create-personal-bookmark.component.html',
  styleUrls: ['./create-personal-bookmark.component.scss'],
})
export class CreatePersonalBookmarkComponent implements OnInit {
  url; // value of "url" query parameter if present
  popup; // if present will go popup to the submitted url
  popupExt; // set from the popup of the extension (firefox currently)}
  desc; // value of "desc" query parameter if present
  title; // value of "title" query parameter if present

  constructor(
    private logger: Logger,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.url = this.route.snapshot.queryParamMap.get('url');
    this.desc = this.route.snapshot.queryParamMap.get('desc');
    this.title = this.route.snapshot.queryParamMap.get('title');
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.popupExt = this.route.snapshot.queryParamMap.get('popupExt');
  }
}
