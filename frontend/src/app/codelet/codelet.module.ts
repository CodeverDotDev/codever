import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { SaveCodeletFormComponent } from './save-codelet-form/save-codelet-form.component';
import { PersonalCodeletsService } from '../core/personal-codelets.service';
import { RouterModule, Routes } from '@angular/router';
import { CreateCodeletComponent } from './create/create-codelet.component';
import { UpdateCodeletComponent } from './update/update-codelet.component';
import { AuthGuard } from '../core/auth/auth-guard.service';
import { CodeletDetailsComponent } from './codelet-details/codelet-details.component';
import { HIGHLIGHT_OPTIONS, HighlightModule, HighlightOptions } from 'ngx-highlightjs';
import { DeleteCodeletDialogComponent } from './delete-codelet-dialog/delete-codelet-dialog.component';
import { AsyncCodeletListComponent } from './async-codelet-list/async-codelet-list.component';
import { CodeletCardBodyComponent } from './async-codelet-list/codelet-code-snippets/codelet-card-body.component';
import { CopySnippetButtonComponent } from './copy-snippet-button/copy-snippet-button.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

const codeletRoutes: Routes = [
  {
    path: 'new',
    canActivate: [AuthGuard],
    component: CreateCodeletComponent,
  },
  {
    path: ':id/edit',
    canActivate: [AuthGuard],
    component: UpdateCodeletComponent,
  },
  {
    path: ':id/details',
    canActivate: [AuthGuard],
    component: CodeletDetailsComponent,
  }
]

@NgModule({
  declarations: [
    SaveCodeletFormComponent,
    CreateCodeletComponent,
    UpdateCodeletComponent,
    CodeletDetailsComponent,
    DeleteCodeletDialogComponent,
    AsyncCodeletListComponent,
    CodeletCardBodyComponent,
    CopySnippetButtonComponent
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
    AsyncCodeletListComponent,
    CopySnippetButtonComponent
  ]
})
export class CodeletModule {
}
