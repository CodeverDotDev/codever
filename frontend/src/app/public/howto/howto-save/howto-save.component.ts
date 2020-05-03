import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-howto-save',
  templateUrl: './howto-save.component.html',
  styleUrls: ['./howto-save.component.scss']
})
export class HowtoSaveComponent implements OnInit {

  environment = environment;

  ngOnInit() {}

}
