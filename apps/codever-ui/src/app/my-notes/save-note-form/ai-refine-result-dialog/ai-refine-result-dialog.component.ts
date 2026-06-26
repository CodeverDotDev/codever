import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MarkdownService } from '../../../core/markdown/markdown.service';

export interface AiRefineResultDialogData {
  originalTitle: string;
  originalContent: string;
  originalTags: string[];
  refinedTitle: string;
  refinedContent: string;
  suggestedTags: string[];
}

export interface AiRefineAcceptedChanges {
  title: string | null;
  content: string | null;
  tags: string[] | null;
}

@Component({
  selector: 'app-ai-refine-result-dialog',
  templateUrl: './ai-refine-result-dialog.component.html',
  styleUrls: ['./ai-refine-result-dialog.component.scss'],
})
export class AiRefineResultDialogComponent implements OnInit {
  acceptTitle = false;
  acceptContent = false;

  /** New suggested tags (not already in original), individually removable */
  selectedSuggestedTags: string[] = [];

  hasTitleChange = false;
  hasContentChange = false;
  hasTagsChange = false;

  originalContentHtml = '';
  refinedContentHtml = '';

  constructor(
    private dialogRef: MatDialogRef<AiRefineResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AiRefineResultDialogData,
    private markdownService: MarkdownService
  ) {}

  ngOnInit(): void {
    this.hasTitleChange =
      !!this.data.refinedTitle &&
      this.data.refinedTitle !== this.data.originalTitle;
    this.hasContentChange =
      !!this.data.refinedContent &&
      this.data.refinedContent !== this.data.originalContent;

    const originalLower = (this.data.originalTags || []).map((t) =>
      t.toLowerCase()
    );
    this.selectedSuggestedTags = (this.data.suggestedTags || []).filter(
      (t) => !originalLower.includes(t.toLowerCase())
    );
    this.hasTagsChange = this.selectedSuggestedTags.length > 0;

    // Default accept all changes
    this.acceptTitle = this.hasTitleChange;
    this.acceptContent = this.hasContentChange;

    this.originalContentHtml =
      this.markdownService.toHtml(this.data.originalContent) ||
      '<em class="text-muted">(empty)</em>';
    this.refinedContentHtml =
      this.markdownService.toHtml(this.data.refinedContent) ||
      '<em class="text-muted">(empty)</em>';
  }

  get originalTagsDisplay(): string {
    return this.data.originalTags && this.data.originalTags.length > 0
      ? this.data.originalTags.join(', ')
      : '(none)';
  }

  removeSuggestedTag(index: number): void {
    this.selectedSuggestedTags.splice(index, 1);
  }

  apply(): void {
    this.dialogRef.close({
      title: this.acceptTitle ? this.data.refinedTitle : null,
      content: this.acceptContent ? this.data.refinedContent : null,
      tags: this.selectedSuggestedTags,
    } as AiRefineAcceptedChanges);
  }

  discard(): void {
    this.dialogRef.close(null);
  }
}
