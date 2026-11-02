// Turns the LaTeX in a string (such as an AI-generated chat title) into readable plain text, for places MathJax doesn't typeset: the browser tab title, attributes and dialogs

// Matches the MathJax delimiters configured in Layout.astro (\(…\), \[…\], $$…$$, $…$)
const MATH_PATTERN = /\\\((.+?)\\\)|\\\[(.+?)\\\]|\$\$(.+?)\$\$|\$(.+?)\$/g;

const SYMBOLS: Record<string, string> = {
    alpha: 'α', beta: 'β', gamma: 'γ', Gamma: 'Γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', varepsilon: 'ε',
    zeta: 'ζ', eta: 'η', theta: 'θ', Theta: 'Θ', iota: 'ι', kappa: 'κ', lambda: 'λ', Lambda: 'Λ',
    mu: 'μ', nu: 'ν', xi: 'ξ', Xi: 'Ξ', pi: 'π', Pi: 'Π', rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ',
    upsilon: 'υ', phi: 'φ', varphi: 'φ', Phi: 'Φ', chi: 'χ', psi: 'ψ', Psi: 'Ψ', omega: 'ω', Omega: 'Ω',
    cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', ast: '*',
    le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', equiv: '≡', sim: '∼', propto: '∝',
    lt: '<', gt: '>', to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftrightarrow: '⇔', implies: '⇒', iff: '⇔',
    infty: '∞', partial: '∂', nabla: '∇', int: '∫', oint: '∮', sum: 'Σ', prod: 'Π', sqrt: '√',
    in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩', emptyset: '∅', forall: '∀', exists: '∃',
    circ: '°', degree: '°', angle: '∠', perp: '⊥', parallel: '∥', triangle: '△', ldots: '…', cdots: '…', dots: '…',
    quad: ' ', qquad: ' ', left: '', right: '', displaystyle: '',
};

const SUPERSCRIPTS: Record<string, string> = {
    0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ',
};

const SUBSCRIPTS: Record<string, string> = {
    0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
};

// Wraps anything longer than one character in parentheses so a/b and x^(…) stay unambiguous
function group(text: string): string {
    const trimmed = text.trim();
    return trimmed.length > 1 ? `(${trimmed})` : trimmed;
}

// Uses Unicode super/subscript characters when every character has one, and ^(…) or _(…) otherwise
function script(text: string, map: Record<string, string>, marker: string): string {
    const trimmed = text.trim();
    const chars = [...trimmed];
    return chars.length > 0 && chars.every(char => char in map)
        ? chars.map(char => map[char]).join('')
        : `${marker}${group(trimmed)}`;
}

function convertMath(math: string): string {
    // Swap symbols first so ^{\infty} counts as one character; commands followed by { (like \sqrt{) are left for the brace pass
    let text = math.replace(/\\([a-zA-Z]+)(?![a-zA-Z{])/g, (match, command: string) => SYMBOLS[command] ?? match);
    let previous = '';

    // Resolve brace groups from the inside out until nothing changes
    while (text !== previous) {
        previous = text;
        text = text
            .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, numerator: string, denominator: string) => `${group(numerator)}/${group(denominator)}`)
            .replace(/\\sqrt\{([^{}]*)\}/g, (_, radicand: string) => `√${group(radicand)}`)
            .replace(/\\(?:text|textbf|textit|mathrm|mathbf|mathit|mathcal|mathbb|operatorname|boldsymbol|vec|hat|bar|overline)\{([^{}]*)\}/g, '$1')
            .replace(/\^\{([^{}]*)\}/g, (_, exponent: string) => script(exponent, SUPERSCRIPTS, '^'))
            .replace(/_\{([^{}]*)\}/g, (_, subscript: string) => script(subscript, SUBSCRIPTS, '_'));
    }

    return text
        .replace(/\^([0-9a-zA-Z+-])/g, (_, exponent: string) => script(exponent, SUPERSCRIPTS, '^'))
        .replace(/_([0-9a-zA-Z])/g, (_, subscript: string) => script(subscript, SUBSCRIPTS, '_'))
        .replace(/\\([{}%$&#_])/g, '$1')
        .replace(/\\[,;:! ]|\\\\/g, ' ')
        .replace(/\\([a-zA-Z]+)/g, (_, command: string) => SYMBOLS[command] ?? command)
        .replace(/[{}]/g, '');
}

export function latexToPlainText(text: string): string {
    return text
        .replace(MATH_PATTERN, (_, inline?: string, display?: string, doubleDollar?: string, dollar?: string) => convertMath(inline ?? display ?? doubleDollar ?? dollar ?? ''))
        .replace(/\s+/g, ' ')
        .trim();
}
