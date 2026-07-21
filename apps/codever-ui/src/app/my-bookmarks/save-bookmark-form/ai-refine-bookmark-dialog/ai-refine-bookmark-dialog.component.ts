import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AiRefineService,
  AiRefineBookmarkResult,
} from '../../../core/ai-refine.service';

export interface AiRefineBookmarkDialogData {
  userId: string;
  name: string;
  location: string;
  tags: string[];
  description?: string;
  defaultPrompt: string;
}

export interface AiRefineBookmarkDialogResult {
  refinedName: string;
  suggestedTags: string[];
  refinedDescription: string;
  pageReachable: boolean;
  customPrompt: string;
}

@Component({
  selector: 'app-ai-refine-bookmark-dialog',
  templateUrl: './ai-refine-bookmark-dialog.component.html',
})
export class AiRefineBookmarkDialogComponent {
  customPrompt: string;
  isRefining = false;
  errorMessage = '';

  readonly outputFormatInstructions = `Return ONLY a valid JSON object (no markdown fences, no extra text) with exactly these keys:
- "refinedName": the improved bookmark name/title
- "suggestedTags": an array of suggested tag strings (lowercase, hyphenated, max 8)
- "refinedDescription": a polished markdown description`;

  constructor(
    private dialogRef: MatDialogRef<AiRefineBookmarkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AiRefineBookmarkDialogData,
    private aiRefineService: AiRefineService
  ) {
    this.customPrompt = data.defaultPrompt;
  }

  get tagSummary(): string {
    return this.data.tags && this.data.tags.length > 0
      ? this.data.tags.join(', ')
      : '(none)';
  }

  refine(): void {
    this.isRefining = true;
    this.errorMessage = '';

    this.aiRefineService
      .refineBookmark(this.data.userId, {
        name: this.data.name,
        location: this.data.location,
        tags: this.data.tags,
        description: this.data.description,
        customPrompt: this.customPrompt,
      })
      .subscribe({
        next: (result: AiRefineBookmarkResult) => {
          this.dialogRef.close({
            ...result,
            customPrompt: this.customPrompt,
          } as AiRefineBookmarkDialogResult);
        },
        error: (err) => {
          this.isRefining = false;
          this.errorMessage =
            err.error?.unreachable || err.status === 503
              ? 'AI service might not be accessible from the outside.'
              : err.error?.message ||
                'Failed to refine bookmark with AI. Please try again later.';
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
