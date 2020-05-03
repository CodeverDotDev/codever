import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-howto-codelets',
  templateUrl: './how-to-codelet.component.html',
  styleUrls: ['./how-to-codelet.component.scss']
})
export class HowToCodeletComponent implements OnInit {

  environment = environment;

  ngOnInit() {}

}
