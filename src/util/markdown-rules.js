export default {
    blockFormula: /^\$\$((\\\$|[^\$])+?)\$\$/,
    
    // inlineFormula: /^\$([^\$\n]+)\$/,     // works, but does not support escaped dollar signs inside formulas
    inlineFormula: /^\$((\\\$|[^\$\n])+)\$/,
    
    // default rule for inline text with support for inline formula exclusion
    inlineText: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n)|(?=\$[^\$\n]+\$)))/
};