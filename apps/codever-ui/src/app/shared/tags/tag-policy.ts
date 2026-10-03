import { UntypedFormArray, UntypedFormControl } from '@angular/forms';

export const MAX_TAGS = 13;
export const RECOMMENDED_AI_TAGS = 8;
export const AI_TAG_GUIDANCE =
  `Strongly prefer at most ${RECOMMENDED_AI_TAGS} relevant tags where possible ` +
  `(lowercase, hyphenated for multi-word). The hard ceiling is ${MAX_TAGS} unique tags; ` +
  'use more than eight only when justified or explicitly requested. ' +
  'Do not remove existing tags merely to meet the recommendation.';

/** Preserve invalid values for visible validation rather than silently discarding them. */
export function normalizeTags(tags: string[]): string[] {
  return [
    ...new Set(
      tags.map((tag) =>
        typeof tag === 'string' ? tag.trim().toLowerCase() : tag
      )
    ),
  ];
}

/** Merge all accepted tags; an over-limit selection stays visible and invalid. */
export function mergeFormTags(
  formTags: UntypedFormArray,
  additions: string[]
): void {
  const merged = normalizeTags([...formTags.getRawValue(), ...additions]);
  formTags.clear({ emitEvent: false });
  merged.forEach((tag) =>
    formTags.push(new UntypedFormControl(tag), { emitEvent: false })
  );
  formTags.updateValueAndValidity();
  formTags.markAsDirty();
}
