import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PublicNoteDetailsComponent } from './public-note-details.component';
import { ShareableNoteDetailsComponent } from './shareable-note-details/shareable-note-details.component';
import { PublicNotesService } from './public-notes.service';
import { PublicNotesComponent } from '../public-notes/public-notes.component';

const publicNotesRoutes: Routes = [
  // list page: /notes
  {
    path: '',
    component: PublicNotesComponent,
    pathMatch: 'full',
  },
  // shareable (via shareableId) must come before :id to avoid "shared" being matched as an id
  {
    path: 'shared/:shareableId',
    component: ShareableNoteDetailsComponent,
  },
  // canonical public URL: /notes/:id/details
  {
    path: ':id/details',
    component: PublicNoteDetailsComponent,
  },
];

@NgModule({
  declarations: [PublicNoteDetailsComponent, ShareableNoteDetailsComponent, PublicNotesComponent],
  imports: [SharedModule, RouterModule.forChild(publicNotesRoutes)],
  providers: [PublicNotesService],
})
export class PublicNotesModule {}

