import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { UserInfoStore } from '../core/user/user-info.store';
import { FeatureToggleService } from '../core/feature-toggle.service';
import { AssistantService } from './assistant.service';
import { AssistantResponse, ChatMessage } from './assistant.model';

/**
 * "Ask Codever" — an in-app chat that answers questions grounded in the
 * user's own bookmarks and notes (Level 1 RAG via the backend assistant).
 */
@Component({
  selector: 'app-assistant',
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.scss'],
  standalone: false,
})
export class AssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer: ElementRef;

  messages: ChatMessage[] = [];
  inputText = '';
  loading = false;
  enabled: boolean | null = null; // null = still resolving toggle
  userId: string;

  readonly examplePrompts = [
    'What did I bookmark about git?',
    'Summarize my notes on Angular.',
    'Find resources I saved about Docker.',
    'Show me bookmarks tagged "kubernetes".',
    'What notes do I have tagged "javascript"?',
    'List everything I saved tagged "productivity".',
  ];

  private shouldScroll = false;

  constructor(
    private assistantService: AssistantService,
    private userInfoStore: UserInfoStore,
    private featureToggleService: FeatureToggleService
  ) {}

  ngOnInit(): void {
    this.userInfoStore.getUserId$().subscribe((userId) => {
      this.userId = userId;
    });
    this.featureToggleService
      .isAiAssistantEnabled()
      .subscribe((enabled) => (this.enabled = enabled));
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  usePrompt(prompt: string): void {
    this.inputText = prompt;
    this.send();
  }

  send(): void {
    const message = this.inputText.trim();
    if (!message || this.loading || !this.userId) {
      return;
    }

    this.messages.push({ role: 'user', content: message });
    this.inputText = '';
    this.loading = true;
    this.shouldScroll = true;

    // Send prior turns (excluding the just-added question) for follow-up context.
    const history = this.messages
      .slice(0, -1)
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    this.assistantService.chat(this.userId, message, history).subscribe({
      next: (response: AssistantResponse) => {
        this.messages.push({
          role: 'assistant',
          content: response.answer,
          references: response.references,
        });
        this.loading = false;
        this.shouldScroll = true;
      },
      error: (err) => {
        this.messages.push({
          role: 'assistant',
          content: this.resolveErrorMessage(err),
          error: true,
        });
        this.loading = false;
        this.shouldScroll = true;
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    // Enter sends; Shift+Enter inserts a newline.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  clear(): void {
    this.messages = [];
  }

  private resolveErrorMessage(err: any): string {
    if (err?.error?.unreachable || err?.status === 503) {
      return 'The AI service is currently not reachable. Please try again later.';
    }
    if (err?.status === 429) {
      return 'The AI service rate limit was exceeded. Please try again in a bit.';
    }
    return (
      err?.error?.message ||
      'Something went wrong while asking Codever. Please try again later.'
    );
  }

  private scrollToBottom(): void {
    try {
      const el = this.scrollContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {
      // no-op
    }
  }
}

