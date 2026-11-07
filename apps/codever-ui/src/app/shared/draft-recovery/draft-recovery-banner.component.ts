import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AuthoringProtection,
  DraftOffer,
} from '../../core/editor-protection/authoring-protection';
import { DRAFT_RETENTION_MS } from '../../core/model/entry-draft';

@Component({
  selector: 'app-draft-recovery-banner',
  templateUrl: './draft-recovery-banner.component.html',
  styleUrls: ['./draft-recovery-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
})
/**
 * Shows the drafts of an eligible create editor: the list of stored drafts
 * to restore or delete, storage problems, the last autosave time and the
 * retention note. It renders nothing for edits, clones and prefilled creates.
 */
export class DraftRecoveryBannerComponent {
  readonly protection = input.required<AuthoringProtection>();
  readonly resourceLabel = input<'bookmark' | 'note'>('note');

  readonly retentionDays = Math.round(DRAFT_RETENTION_MS / 86_400_000);
  /** ID of the draft awaiting confirmation to replace the current input. */
  readonly confirmingId = signal<string | null>(null);
  readonly state = computed(() => this.protection().state());
  readonly offers = computed(() => this.protection().offers());
  /** Hidden for ineligible editors and once the session ended (saved). */
  readonly visible = computed(
    () => this.protection().wasEligible && this.state() !== 'ended'
  );

  /**
   * Restores a draft right away into an untouched form; if the user already
   * typed something, asks for confirmation first.
   */
  restore(offer: DraftOffer): void {
    if (this.protection().isChanged()) {
      this.confirmingId.set(offer.id);
      return;
    }
    this.protection().restore(offer.id);
  }

  confirmRestore(offer: DraftOffer): void {
    this.confirmingId.set(null);
    this.protection().restore(offer.id);
  }

  /** Keeps the current input; the draft stays listed. */
  cancelReplace(): void {
    this.confirmingId.set(null);
  }

  /** Removes a stored draft; the current input is kept. */
  delete(offer: DraftOffer): void {
    this.confirmingId.set(null);
    this.protection().deleteOffer(offer.id);
  }
}
