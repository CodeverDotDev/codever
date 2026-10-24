import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-terms-of-service',
  templateUrl: './terms-of-service.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./terms-of-service.component.scss'],
})
export class TermsOfServiceComponent implements OnInit {
  constructor() {
    // Do stuff
  }

  ngOnInit() {
    console.log('Hello privacy-policy');
  }
}
