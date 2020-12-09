import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CreateSnippetFormComponent } from './create-snippet-form/create-snippet-form.component';
import { PersonalCodeletsService } from '../core/personal-codelets.service';
import { RouterModule, Routes } from '@angular/router';
import { CreateCodeletComponent } from './create/create-codelet.component';
import { UpdateCodeletComponent } from './update/update-codelet.component';
import { AuthGuard } from '../core/auth/auth-guard.service';
import { SnippetDetailsPageComponent } from './snippet-details-page/snippet-details-page.component';
import { HIGHLIGHT_OPTIONS, HighlightModule, HighlightOptions } from 'ngx-highlightjs';
import { DeleteCodeletDialogComponent } from './delete-codelet-dialog/delete-codelet-dialog.component';
import { AsyncCodeletListComponent } from './async-codelet-list/async-codelet-list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CopyToMineSnippetComponent } from './copy-to-mine/copy-to-mine-snippet.component';
import { UpdateSnippetFormComponent } from './update-codelet-form/update-snippet-form.component';

const codeletRoutes: Routes = [
  {
    path: 'new',
    canActivate: [AuthGuard],
    component: CreateCodeletComponent,
  },
  {
    path: ':id/copy-to-mine',
    canActivate: [AuthGuard],
    component: CopyToMineSnippetComponent,
  },
  {
    path: ':id/edit',
    canActivate: [AuthGuard],
    component: UpdateCodeletComponent,
  },
  {
    path: ':id/details',
    canActivate: [AuthGuard],
    component: SnippetDetailsPageComponent,
  }
]

@NgModule({
  declarations: [
    CreateSnippetFormComponent,
    UpdateSnippetFormComponent,
    CreateCodeletComponent,
    UpdateCodeletComponent,
    SnippetDetailsPageComponent,
    DeleteCodeletDialogComponent,
    AsyncCodeletListComponent,
    CopyToMineSnippetComponent
  ],
  imports: [
    RouterModule.forChild(codeletRoutes),
    SharedModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    HighlightModule
  ],
  providers: [
    PersonalCodeletsService,
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: <HighlightOptions>{
        lineNumbers: true
      }
    }
  ],
  entryComponents: [
    DeleteCodeletDialogComponent
  ],
  exports: [
    AsyncCodeletListComponent
  ]
})
export class CodeletModule {
}
