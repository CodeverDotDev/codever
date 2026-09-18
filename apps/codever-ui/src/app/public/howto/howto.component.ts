import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { FeatureToggleService } from '../../core/feature-toggle.service';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelContent,
} from '@angular/material/expansion';
import { HowtoGetStartedComponent } from './howto-get-started/howto-get-started.component';
import { HowToBookmarksComponent } from './howto-bookmarks/how-to-bookmarks.component';
import { HowToNotesComponent } from './howto-notes/how-to-notes.component';
import { HowToBookmarkletComponent } from './howto-bookmarklets/how-to-bookmarklet.component';
import { HowtoHotkeysComponent } from './howto-hotkeys/howto-hotkeys.component';
import { HowToMcpComponent } from './howto-mcp/how-to-mcp.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-howto',
  templateUrl: './howto.component.html',
  styleUrls: ['./howto.component.scss'],
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelContent,
    HowtoGetStartedComponent,
    HowToBookmarksComponent,
    HowToNotesComponent,
    HowToBookmarkletComponent,
    HowtoHotkeysComponent,
    HowToMcpComponent,
    AsyncPipe,
  ],
})
export class HowtoComponent implements OnInit {
  environment = environment;
  mcpServerEnabled$: Observable<boolean>;

  constructor(private featureToggleService: FeatureToggleService) {}

  ngOnInit() {
    this.mcpServerEnabled$ = this.featureToggleService.isMcpServerEnabled();
  }
}
