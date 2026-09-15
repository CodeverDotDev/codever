import { NgModule } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { AiRefineResultDialogComponent } from './ai-refine-result-dialog.component';

@NgModule({
  imports: [SharedModule, AiRefineResultDialogComponent],
  exports: [AiRefineResultDialogComponent],
})
export class AiRefineResultDialogModule {}
