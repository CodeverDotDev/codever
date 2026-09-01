import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AiRefineService, AiRefineResult } from '../../../core/ai-refine.service';

export interface AiRefineDialogData {
  userId: string;
  title: string;
  content: string;
  tags: string[];
  reference?: string;
  defaultPrompt: string;
}

export interface AiRefineDialogResult {
  refinedContent: string;
  suggestedTags: string[];
  suggestedTitle: string;
  customPrompt: string;
}

@Component({
    selector: 'app-ai-refine-dialog',
    templateUrl: './ai-refine-dialog.component.html',
    standalone: false
})
export class AiRefineDialogComponent {
  customPrompt: string;
  isRefining = false;
  errorMessage = '';

  readonly outputFormatInstructions = `Return ONLY a valid JSON object (no markdown fences, no extra text) with exactly these keys:
- "refinedContent": the polished markdown content
- "suggestedTags": an array of suggested tag strings
- "suggestedTitle": the improved title (or the original if it's already good)`;

  constructor(
    private dialogRef: MatDialogRef<AiRefineDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AiRefineDialogData,
    private aiRefineService: AiRefineService
  ) {
    this.customPrompt = data.defaultPrompt;
  }

  get tagSummary(): string {
    return this.data.tags && this.data.tags.length > 0
      ? this.data.tags.join(', ')
      : '(none)';
  }

  get contentLength(): number {
    return this.data.content ? this.data.content.length : 0;
  }

  refine(): void {
    this.isRefining = true;
    this.errorMessage = '';

    this.aiRefineService
      .refineNote(this.data.userId, {
        title: this.data.title,
        content: this.data.content,
        tags: this.data.tags,
        reference: this.data.reference,
        customPrompt: this.customPrompt,
      })
      .subscribe({
        next: (result: AiRefineResult) => {
          this.dialogRef.close({
            ...result,
            customPrompt: this.customPrompt,
          } as AiRefineDialogResult);
        },
        error: (err) => {
          this.isRefining = false;
          this.errorMessage =
            err.error?.unreachable || err.status === 503
              ? 'AI service might not be accessible from the outside.'
              : err.error?.message ||
                'Failed to refine note with AI. Please try again later.';
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
