import { Component, Input, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-extensions',
  templateUrl: './extensions.component.html',
  styleUrls: ['./extensions.component.scss']
})
export class ExtensionsComponent implements OnInit {

  environment = environment;

  @Input()
  logoSize = 48;

  @Input()
  showEntryParagraph = true;

  ngOnInit() {}

}
