import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss'],
    standalone: false
})
export class PrivacyPolicyComponent implements OnInit {
  constructor() {
    // Do stuff
  }

  ngOnInit() {
    console.log('Hello privacy-policy');
  }
}
