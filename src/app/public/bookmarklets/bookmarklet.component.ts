import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-about',
  templateUrl: './bookmarklet.component.html',
  styleUrls: ['./bookmarklet.component.scss']
})
export class BookmarkletComponent implements OnInit {

  environment = environment;

  ngOnInit() {}

}
