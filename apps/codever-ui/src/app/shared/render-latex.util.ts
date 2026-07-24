import katex from 'katex';

/**
 * Pre-processes a Markdown/text string and replaces LaTeX math delimiters
 * with KaTeX-rendered HTML **before** the string is passed to `marked`.
 *
 * Supports:
 *  - Display math:  $$...$$ and \[...\]
 *  - Inline math:   $...$ and \(...\)
 *
 * Fenced code blocks (``` ... ```) and inline code spans (`...`) are skipped
 * so that dollar signs inside code are not treated as math delimiters.
 */
export function renderLatex(text: string): string {
  if (!text) {
    return text;
  }

  // Split on fenced code blocks AND inline code spans so we never touch code.
  // Each capturing group becomes an odd-indexed token that we skip:
  //  - ```...``` fenced blocks (with optional language)
  //  - ``...`` / `...` inline code spans
  const parts = text.split(/(```[\s\S]*?```|`+[^`\n]*?`+)/g);

  for (let i = 0; i < parts.length; i++) {
    // Odd indices are code (fenced or inline) — skip them
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
    // to distinguish currency from math) and must not span line breaks.
    //
    // Option A (conservative): only render when the content contains a TeX
    // "signal" character (\, ^, _, { or }). This prevents ordinary prose with
    // stray dollar signs — currency ($5/mo, $40), inline `$text`, etc. — from
    // being greedily paired and mangled into garbage math. The trade-off is
    // that bare single-variable math like `$x$` is left as plain text.
    segment = segment.replace(
      /(?<![\\$])\$(?!\$)(\S(?:[^$\\\n]|\\.)*?\S|\S)\$(?!\d)/g,
      (match, math) => {
        return hasTexSignal(math) ? renderKatex(math.trim(), false) : match;
      }
    );

    parts[i] = segment;
  }

  return parts.join('');
}

/**
 * Heuristic to decide whether the content between two `$` signs is genuine
 * LaTeX math rather than incidental prose (currency, `$text`, etc.).
 *
 * Real inline math almost always contains a TeX control/structure character:
 *   \  — commands (\alpha, \frac, \int)
 *   ^  — superscript (x^2)
 *   _  — subscript (a_1)
 *   {} — grouping (\frac{a}{b})
 */
function hasTexSignal(math: string): boolean {
  return /[\\^_{}]/.test(math);
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

