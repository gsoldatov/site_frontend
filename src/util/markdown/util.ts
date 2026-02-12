export const rules = {
    blockFormula: /^\$\$((\\\$|[^\$])+?)\$\$/,
    
    // inlineFormula: /^\$([^\$\n]+)\$/,     // works, but does not support escaped dollar signs inside formulas
    inlineFormula: /^\$((\\\$|[^\$\n])+)\$/,
    
    // default rule for inline text with support for inline formula exclusion
    inlineText: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n)|(?=\$[^\$\n]+\$)))/,

    // `other` rules from marked/src/rules
    notSpaceStart: /^\S*/,
    endingNewline: /\n$/,
    escapeTest: /[&<>"']/,
    escapeReplace: /[&<>"']/g,
    escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
    escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
};


/**
 * Marked `escape` function copy, which is no longer exported
 */
export function escape(html: string, encode?: boolean) {
    if (encode) {
        if (rules.escapeTest.test(html)) {
        return html.replace(rules.escapeReplace, getEscapeReplacement);
        }
    } else {
        if (rules.escapeTestNoEncode.test(html)) {
        return html.replace(rules.escapeReplaceNoEncode, getEscapeReplacement);
        }
    }

    return html;
}


const escapeReplacements: { [index: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];
