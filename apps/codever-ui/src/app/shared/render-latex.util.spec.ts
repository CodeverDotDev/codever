import { renderLatex } from './render-latex.util';

describe('renderLatex', () => {
  // ---------------------------------------------------------------------------
  // Null / empty / no-math input
  // ---------------------------------------------------------------------------

  it('should return null for null input', () => {
    expect(renderLatex(null)).toBeNull();
  });

  it('should return undefined for undefined input', () => {
    expect(renderLatex(undefined)).toBeUndefined();
  });

  it('should return empty string for empty input', () => {
    expect(renderLatex('')).toBe('');
  });

  it('should return plain text unchanged when there is no math', () => {
    const text = 'Hello world, no math here.';
    expect(renderLatex(text)).toBe(text);
  });

  // ---------------------------------------------------------------------------
  // Inline math: $...$
  // ---------------------------------------------------------------------------

  it('should render inline math with single dollar signs', () => {
    const result = renderLatex('The formula $E=mc^2$ is famous.');
    expect(result).toContain('katex');
    expect(result).toContain('The formula');
    expect(result).toContain('is famous.');
    // The raw LaTeX should no longer appear literally
    expect(result).not.toContain('$E=mc^2$');
  });

  it('should render multiple inline math expressions in the same text', () => {
    const result = renderLatex('We have $a_1$ and $b^2$ here.');
    // Both should be rendered — count katex occurrences
    const matches = result.match(/katex/g);
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(result).not.toContain('$a_1$');
    expect(result).not.toContain('$b^2$');
  });

  // ---------------------------------------------------------------------------
  // Display math: $$...$$
  // ---------------------------------------------------------------------------

  it('should render display math with double dollar signs', () => {
    const result = renderLatex('$$\\int_0^1 x^2 dx$$');
    expect(result).toContain('katex');
    expect(result).not.toContain('$$');
  });

  it('should render multi-line display math', () => {
    const result = renderLatex('$$\n\\frac{a}{b}\n$$');
    expect(result).toContain('katex');
    expect(result).not.toContain('$$');
  });

  // ---------------------------------------------------------------------------
  // Display math: \[...\]
  // ---------------------------------------------------------------------------

  it('should render display math with backslash-bracket delimiters', () => {
    const result = renderLatex('\\[x^2 + y^2 = z^2\\]');
    expect(result).toContain('katex');
    expect(result).not.toContain('\\[');
    expect(result).not.toContain('\\]');
  });

  // ---------------------------------------------------------------------------
  // Inline math: \(...\)
  // ---------------------------------------------------------------------------

  it('should render inline math with backslash-paren delimiters', () => {
    const result = renderLatex('The value \\(\\alpha\\) is small.');
    expect(result).toContain('katex');
    expect(result).toContain('The value');
    expect(result).toContain('is small.');
  });

  // ---------------------------------------------------------------------------
  // Fenced code blocks should be untouched
  // ---------------------------------------------------------------------------

  it('should NOT process dollar signs inside fenced code blocks', () => {
    const input = '```python\nprice = $100\n```';
    const result = renderLatex(input);
    // The code block should pass through unchanged
    expect(result).toBe(input);
  });

  it('should process math outside code blocks but leave code blocks intact', () => {
    const input = 'Math: $x^2$\n\n```\n$not_math$\n```\n\nMore math: $y^2$';
    const result = renderLatex(input);
    // Math outside code should be rendered
    expect(result).toContain('katex');
    // Code block content should be preserved as-is
    expect(result).toContain('```\n$not_math$\n```');
  });

  // ---------------------------------------------------------------------------
  // Escaped dollars should NOT trigger math mode
  // ---------------------------------------------------------------------------

  it('should not render escaped dollar signs as math', () => {
    const input = 'Price is \\$100 and \\$200.';
    const result = renderLatex(input);
    // No katex rendering should occur
    expect(result).not.toContain('class="katex"');
  });

  // ---------------------------------------------------------------------------
  // Graceful degradation for malformed LaTeX
  // ---------------------------------------------------------------------------

  it('should degrade gracefully for invalid LaTeX (not throw)', () => {
    // KaTeX with throwOnError: false still renders, but with an error span
    // The function should never throw
    expect(() => renderLatex('$\\invalidcommandxyz$')).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // Mixed content
  // ---------------------------------------------------------------------------

  it('should handle mixed inline and display math', () => {
    const input = 'Inline $a+b^2$ and display:\n$$c+d$$\nDone.';
    const result = renderLatex(input);
    expect(result).toContain('katex');
    expect(result).toContain('Done.');
    expect(result).not.toContain('$a+b^2$');
    expect(result).not.toContain('$$c+d$$');
  });

  it('should handle all four delimiter styles together', () => {
    const input = [
      'Inline dollar: $a^2$',
      'Inline paren: \\(b\\)',
      'Display dollar: $$c$$',
      'Display bracket: \\[d\\]',
    ].join('\n');
    const result = renderLatex(input);
    const matches = result.match(/katex/g);
    // All four expressions should produce katex output
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it('should render single-token math that has a TeX signal char', () => {
    const result = renderLatex('$x^2$');
    expect(result).toContain('katex');
  });

  it('should NOT render bare single-variable math without a TeX signal', () => {
    // Option A trade-off: `$x$` has no \ ^ _ { } signal, so it stays literal
    // to avoid mis-rendering everyday dollar-sign prose.
    const input = 'The value $x$ is small.';
    const result = renderLatex(input);
    expect(result).not.toContain('class="katex"');
    expect(result).toBe(input);
  });

  it('should not treat adjacent dollar signs in text as math (e.g. $$ with nothing)', () => {
    // Empty display math — KaTeX handles empty string gracefully
    const result = renderLatex('$$$$');
    // Should not throw
    expect(result).toBeDefined();
  });

  it('should not treat a lone dollar sign as math', () => {
    const input = 'This costs $ and that costs $.';
    const result = renderLatex(input);
    // No katex rendering — single $ with space after is not math
    expect(result).toBe(input);
  });

  // ---------------------------------------------------------------------------
  // Regression: prose with stray dollar signs must NOT be mangled into math
  // ---------------------------------------------------------------------------

  it('should NOT render currency amounts as math', () => {
    const input = 'Pro is ~$4–6/month or ~$40–50/year with a $2 GB cap.';
    const result = renderLatex(input);
    expect(result).not.toContain('class="katex"');
    expect(result).toBe(input);
  });

  it('should NOT process dollar signs inside inline code spans', () => {
    const input = 'MongoDB `$text` cannot search ciphertext.';
    const result = renderLatex(input);
    expect(result).not.toContain('class="katex"');
    expect(result).toBe(input);
  });

  it('should NOT pair dollar signs across a table of prose (mixed currency + `$text`)', () => {
    const input =
      'Storage/disk-level at rest lets `$text` search work, priced at ~$5/mo up to $40.';
    const result = renderLatex(input);
    expect(result).not.toContain('class="katex"');
    expect(result).toBe(input);
  });
});

