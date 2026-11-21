import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';
import { PersonalCollectionsService } from '../../../core/personal-collections.service';
import {
  DEFAULT_TAG_FOLDER_LIMIT,
  toNetscapeBookmarksHtml,
} from '../../../core/export/netscape-bookmarks.util';

export type BookmarksExportFormat = 'json' | 'html';

export interface ExportBookmarksDialogData {
  userId: string;
}

interface PreparedExport {
  blob: Blob;
  filename: string;
}

@Component({
  selector: 'app-export-bookmarks-dialog',
  templateUrl: './export-bookmarks-dialog.component.html',
  styleUrls: ['./export-bookmarks-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatDialogTitle, MatDialogContent, FormsModule, MatDialogActions],
})
export class ExportBookmarksDialogComponent {
  format: BookmarksExportFormat = 'json';
  tagFolderLimit = DEFAULT_TAG_FOLDER_LIMIT;
  allTagFolders = false;

  busy = false;
  /** Outcome of the last browser HTML export, shown in the dialog. */
  resultMessage: string;
  errorMessage: string;

  private readonly userId: string;

  constructor(
    private dialogRef: MatDialogRef<ExportBookmarksDialogComponent>,
    private personalBookmarksService: PersonalBookmarksService,
    private personalCollectionsService: PersonalCollectionsService,
    @Inject(MAT_DIALOG_DATA) data: ExportBookmarksDialogData
  ) {
    this.userId = data.userId;
  }

  get canExport(): boolean {
    return (
      !this.busy &&
      (this.format === 'json' ||
        this.allTagFolders ||
        (Number.isInteger(this.tagFolderLimit) && this.tagFolderLimit >= 1))
    );
  }

  async download(): Promise<void> {
    const prepared = await this.prepare();
    if (prepared) {
      const blobUrl = window.URL.createObjectURL(prepared.blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = prepared.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Revoke on the next tick so the download has started in every browser.
      setTimeout(() => window.URL.revokeObjectURL(blobUrl));
    }
  }

  async viewInBrowser(): Promise<void> {
    const prepared = await this.prepare();
    if (prepared) {
      window.open(window.URL.createObjectURL(prepared.blob));
    }
  }

  close() {
    this.dialogRef.close();
  }

  private async prepare(): Promise<PreparedExport | null> {
    if (!this.canExport) {
      return null;
    }
    this.busy = true;
    this.resultMessage = undefined;
    this.errorMessage = undefined;
    try {
      return this.format === 'json'
        ? await this.prepareJson()
        : await this.prepareHtml();
    } catch (error) {
      this.errorMessage =
        'There was a problem preparing the export. Please try again later.';
      return null;
    } finally {
      this.busy = false;
    }
  }

  private async prepareJson(): Promise<PreparedExport> {
    const bookmarks = await firstValueFrom(
      this.personalBookmarksService.getAllMyBookmarks(this.userId)
    );

    return {
      blob: new Blob([JSON.stringify(bookmarks, null, 2)], {
        type: 'application/json',
      }),
      filename: `bookmarks_${new Date().toISOString()}.json`,
    };
  }

  private async prepareHtml(): Promise<PreparedExport | null> {
    const { bookmarks, collections } = await firstValueFrom(
      forkJoin({
        bookmarks: this.personalBookmarksService.getAllMyBookmarks(
          this.userId
        ),
        collections: this.personalCollectionsService.getAllUserCollections(
          this.userId
        ),
      })
    );
    if (bookmarks.length === 0) {
      this.resultMessage = 'You have no bookmarks to export.';
      return null;
    }

    const exportDate = new Date();
    const result = toNetscapeBookmarksHtml(
      bookmarks,
      collections,
      { tagFolderLimit: this.allTagFolders ? null : this.tagFolderLimit },
      exportDate
    );
    this.resultMessage =
      `Exported ${result.exportedCount} bookmarks.` +
      (result.skippedCount > 0
        ? ` ${result.skippedCount} left out because their URL starts with` +
          ' javascript: or data:.'
        : '');

    return {
      blob: new Blob([result.html], { type: 'text/html' }),
      filename: `codever-bookmarks_${exportDate.toISOString()}.html`,
    };
  }
}
