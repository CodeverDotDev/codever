import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import * as screenfull from 'screenfull';
import { Note } from '../../../core/model/note';

@Component({
  selector: 'app-note-content',
  templateUrl: './note-content.component.html',
  styleUrls: ['./note-content.component.scss'],
})
export class NoteContentComponent implements AfterViewInit, AfterViewChecked {
  @Input()
  note: Note;

  @Input()
  queryText: string;

  @Input()
  partOfList = false;

  show = false; // add one more property
  public showMoreText = false;

  @ViewChild('noteContentDiv', { static: false }) elementView: ElementRef;
  public viewHeight: number;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.viewHeight = this.elementView.nativeElement.offsetHeight;
    console.log('viewHeight: ' + this.viewHeight);
  }

  private readonly maxNoteHeightInList = 200;

  ngAfterViewChecked(): void {
    const show = this.viewHeight > this.maxNoteHeightInList;
    if (show !== this.show) {
      // check if it change, tell CD update view
      this.show = show;
      this.changeDetectorRef.detectChanges();
    }
  }

  toggleFullScreen(codePart: HTMLElement) {
    if (screenfull.isEnabled) {
      screenfull.toggle(codePart);
    }
  }
}
