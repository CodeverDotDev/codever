import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-howto-search',
  templateUrl: './howto-search.component.html',
  styleUrls: ['./howto-search.component.scss']
})
export class HowtoSearchComponent implements OnInit {

  environment = environment;

  ngOnInit() {}

}
