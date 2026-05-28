import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Collection } from '../../core/model/collection';

@Component({
  selector: 'app-collection-form-dialog',
  templateUrl: './collection-form-dialog.component.html',
  styleUrls: ['./collection-form-dialog.component.scss'],
})
export class CollectionFormDialogComponent implements OnInit {
  name = '';
  description = '';
  color = '';
  mode: 'create' | 'edit' = 'create';

  constructor(
    private dialogRef: MatDialogRef<CollectionFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { mode: 'create' | 'edit'; collection?: Collection }
  ) {}

  ngOnInit(): void {
    this.mode = this.data.mode;
    if (this.data.collection) {
      this.name = this.data.collection.name;
      this.description = this.data.collection.description || '';
      this.color = this.data.collection.color || '';
    }
  }

  save(): void {
    if (!this.name.trim()) {
      return;
    }
    this.dialogRef.close({
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      color: this.color || undefined,
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}

