import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CreateSnippetFormComponent } from './create-snippet-form/create-snippet-form.component';
import { PersonalSnippetsService } from '../core/personal-snippets.service';
import { RouterModule, Routes } from '@angular/router';
import { CreateSnippetComponent } from './create/create-snippet.component';
import { UpdateSnippetComponent } from './update/update-snippet.component';
import { AuthGuard } from '../core/auth/auth-guard.service';
import { SnippetDetailsPageComponent } from './snippet-details-page/snippet-details-page.component';
import { HIGHLIGHT_OPTIONS, HighlightModule, HighlightOptions } from 'ngx-highlightjs';
import { DeleteSnippetDialogComponent } from './delete-snippet-dialog/delete-snippet-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CopyToMineSnippetComponent } from './copy-to-mine/copy-to-mine-snippet.component';
import { UpdateSnippetFormComponent } from './update-snippet-form/update-snippet-form.component';
import { SnippetFormBaseComponent } from './snippet-form-base/snippet-form.base.component';

const snippetRoutes: Routes = [
  {
    path: 'new',
    canActivate: [AuthGuard],
    component: CreateSnippetComponent,
  },
  {
    path: ':id/copy-to-mine',
    canActivate: [AuthGuard],
    component: CopyToMineSnippetComponent,
  },
  {
    path: ':id/edit',
    canActivate: [AuthGuard],
    component: UpdateSnippetComponent,
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
        CreateSnippetComponent,
        UpdateSnippetComponent,
        SnippetDetailsPageComponent,
        DeleteSnippetDialogComponent,
        CopyToMineSnippetComponent,
        SnippetFormBaseComponent
    ],
    imports: [
        RouterModule.forChild(snippetRoutes),
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
        PersonalSnippetsService,
        {
            provide: HIGHLIGHT_OPTIONS,
            useValue: <HighlightOptions>{
                lineNumbers: true
            }
        }
    ]
})
export class MySnippetsModule {
}
