import { convertToParamMap } from '@angular/router';
import { isBlankStartCreate } from './draft-eligibility';

describe('isBlankStartCreate', () => {
  const prefill = ['url', 'title', 'popup', 'initiator'];
  const eligible = (params: Record<string, string>) =>
    isBlankStartCreate(convertToParamMap(params), prefill);

  it('accepts a create without query parameters', () => {
    expect(eligible({})).toBe(true);
  });

  it('accepts the in-app "+" menu initiator', () => {
    expect(eligible({ initiator: 'browser' })).toBe(true);
  });

  it('ignores parameters that supply no content', () => {
    expect(eligible({ utm_source: 'mail' })).toBe(true);
  });

  it('excludes external initiators', () => {
    expect(eligible({ initiator: 'bookmarklet' })).toBe(false);
    expect(eligible({ initiator: '' })).toBe(false);
  });

  it('excludes prefill parameters, even with the in-app initiator', () => {
    expect(eligible({ initiator: 'browser', url: 'https://x.dev' })).toBe(
      false
    );
    expect(eligible({ title: '' })).toBe(false);
    expect(eligible({ popup: 'true' })).toBe(false);
  });
});
