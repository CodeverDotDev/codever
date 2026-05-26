import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-personal-note-create',
  templateUrl: './create-personal-note.component.html',
})
export class CreatePersonalNoteComponent implements OnInit {
  initiator: string;
  title: string;
  content: string;
  reference: string;
  // Extension-origin metadata (IDE extensions)
  tags: string[];
  originLocation: string;
  originFile: string;
  originProject: string;
  originWorkspace: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.title = this.route.snapshot.queryParamMap.get('title');
    this.initiator = this.route.snapshot.queryParamMap.get('initiator');
    this.reference = this.route.snapshot.queryParamMap.get('reference');

    // IDE extension params (VS Code / IntelliJ)
    const code = this.route.snapshot.queryParamMap.get('code');
    const tagsStr = this.route.snapshot.queryParamMap.get('tags');
    const comment = this.route.snapshot.queryParamMap.get('comment');
    this.originLocation =
      this.route.snapshot.queryParamMap.get('location') ||
      this.route.snapshot.queryParamMap.get('sourceUrl'); // legacy alias
    this.originFile = this.route.snapshot.queryParamMap.get('file');
    this.originProject = this.route.snapshot.queryParamMap.get('project');
    this.originWorkspace = this.route.snapshot.queryParamMap.get('workspace');

    if (tagsStr) {
      // split on comma, trim whitespace, deduplicate, add code-snippet tag
      const parsed = tagsStr
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => !!t);
      if (!parsed.includes('code-snippet')) {
        parsed.push('code-snippet');
      }
      this.tags = parsed;
    }

    if (code) {
      // Build markdown content: optional comment header + fenced code block
      const lang = (this.tags && this.tags.length > 0)
        ? this.tags[0]
        : '';
      const parts: string[] = [];
      if (comment && comment.trim()) {
        parts.push(comment.trim());
      }
      parts.push('```' + lang);
      parts.push(code);
      parts.push('```');
      this.content = parts.join('\n');
    } else {
      // Plain note (bookmarklet, direct navigation)
      this.content = this.route.snapshot.queryParamMap.get('content');
    }

    // Use location as reference if no explicit reference was given
    if (!this.reference && this.originLocation) {
      this.reference = this.originLocation;
    }
  }
}
