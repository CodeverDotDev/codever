import katex from 'katex';

/**
 * Pre-processes a Markdown/text string and replaces LaTeX math delimiters
 * with KaTeX-rendered HTML **before** the string is passed to `marked`.
 *
 * Supports:
 *  - Display math:  $$...$$ and \[...\]
 *  - Inline math:   $...$ and \(...\)
 *
 * Fenced code blocks (``` ... ```) are skipped so that dollar signs
 * inside code are not treated as math delimiters.
 */
export function renderLatex(text: string): string {
  if (!text) {
    return text;
  }

  // Split on fenced code blocks so we never touch code
  // The regex captures ``` blocks (with optional language) as separate tokens
  const parts = text.split(/(```[\s\S]*?```)/g);

  for (let i = 0; i < parts.length; i++) {
    // Odd indices are fenced code blocks — skip them
    if (i % 2 === 1) {
      continue;
    }

    let segment = parts[i];

    // Display math: $$...$$  (must come before inline $ to avoid conflicts)
    segment = segment.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math) => {
      return renderKatex(math.trim(), true);
    });

    // Display math: \[...\]
    segment = segment.replace(/\\\[([\s\S]+?)\\\]/g, (_match, math) => {
      return renderKatex(math.trim(), true);
    });

    // Inline math: \(...\)
    segment = segment.replace(/\\\(([\s\S]+?)\\\)/g, (_match, math) => {
      return renderKatex(math.trim(), false);
    });

    // Inline math: $...$
    // Negative lookbehind for \ (escaped dollar) and $ (to avoid matching $$)
    // The content must not start or end with a space (standard TeX convention
    // to distinguish currency from math).
    segment = segment.replace(
      /(?<![\\$])\$(?!\$)(\S(?:[^$\\]|\\.)*?\S|\S)\$(?!\d)/g,
      (_match, math) => {
        return renderKatex(math.trim(), false);
      }
    );

    parts[i] = segment;
  }

  return parts.join('');
}

/**
 * Render a single LaTeX expression to HTML via KaTeX.
 * On error, returns the original LaTeX wrapped in a styled <code> tag
 * so malformed expressions degrade gracefully.
 */
function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      // trust: allow \url, \href, \colorbox etc.
      trust: true,
    });
  } catch (e) {
    // Fallback: show raw LaTeX in a code element
    const escaped = latex
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<code class="katex-error" title="KaTeX parse error">${escaped}</code>`;
  }
}

