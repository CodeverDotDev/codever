import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { FeatureToggleService } from '../../core/feature-toggle.service';

@Component({
  selector: 'app-howto',
  templateUrl: './howto.component.html',
  styleUrls: ['./howto.component.scss'],
  standalone: false,
})
export class HowtoComponent implements OnInit {
  environment = environment;
  mcpServerEnabled$: Observable<boolean>;

  constructor(private featureToggleService: FeatureToggleService) {}

  ngOnInit() {
    this.mcpServerEnabled$ = this.featureToggleService.isMcpServerEnabled();
  }
}
