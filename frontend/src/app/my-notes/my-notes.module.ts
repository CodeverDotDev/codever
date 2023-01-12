import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/auth/auth-guard.service';
import { HIGHLIGHT_OPTIONS, HighlightModule, HighlightOptions } from 'ngx-highlightjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CreatePersonalNoteComponent } from './create-note/create-personal-note.component';
import { UpdatePersonalNoteComponent } from './update-note/update-personal-note.component';
import { NoteEditorComponent } from './save-note-form/note-editor.component';
import { NoteDetailsComponent } from '../shared/note-details/note-details.component';
import { PersonalNotesService } from '../core/personal-notes.service';

const snippetRoutes: Routes = [
  {
    path: 'new',
    canActivate: [AuthGuard],
    component: CreatePersonalNoteComponent,
  },
  {
    path: ':id/edit',
    canActivate: [AuthGuard],
    component: UpdatePersonalNoteComponent,
  },
  {
    path: ':id/details',
    canActivate: [AuthGuard],
    component: NoteDetailsComponent,
  }
]

@NgModule({
  declarations: [
    CreatePersonalNoteComponent,
    UpdatePersonalNoteComponent,
    NoteEditorComponent
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
  exports: [
    NoteDetailsComponent
  ],
  providers: [
    PersonalNotesService,
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: <HighlightOptions>{
        lineNumbers: true
      }
    }
  ]
})
export class MyNotesModule {
}
