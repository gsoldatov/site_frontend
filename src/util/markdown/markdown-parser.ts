import marked from "marked";
// @ts-ignore (import from library subfolder results in no types being visible)
import { escape } from "marked/src/helpers";

// Import core library and white-listed languages to manually register them
// @ts-ignore (import from library subfolder results in no types being visible)
import hljs from "highlight.js/lib/core";
import HLJSUsedLanguages from "./hljs-used-languages.json";

import katex from "katex";

import rules from "./markdown-rules";


/**
 * Markdown parser setup. 
 */
const tokenizer = {
    code(src: string) {
        // Tokenize block formulas ($$ ... $$) as code
        const match = src.match(rules.blockFormula);

        if (match) {
            return {
                type: "code",
                raw: match[0],
                text: match[0]
            }
        }
        // Use original tokenizer if no match is found
        return false;
    },

    codespan(src: string) {
        // Tokenize inline block formulas ($ ... $) as a codespan
        const match = src.match(rules.inlineFormula);
        if (match) {
            return {
                type: "codespan",
                raw: match[0],
                text: match[0]
            }
        }

        // Use original tokenizer if no match is found
        return false;
    },

    inlineText(this: marked.Tokenizer, src: string, inRawBlock: boolean, smartypants: any) {
        // Default inline text tokenizer with an additional rule for stopping before inline formulas
        const cap = rules.inlineText.exec(src);
        if (cap) {
            let text;
            if (inRawBlock) {
                text = this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0])) : cap[0];
            } else {
            text = escape(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
            }
            return {
                type: 'text',
                raw: cap[0],
                text
            };
        }
    }
};


const renderer = {
    // Modified default heading renderer which adds +2 to header levels and adds a classname
    heading(this: marked.Tokenizer, text: string, _level: number, raw: string, slugger: any) {
        const level = Math.min(_level + 2, 6);
      
        if (this.options.headerIds) {
            return '<h'
                + level
                + ' id="'
                + this.options.headerPrefix
                + slugger.slug(raw)
                + '" class="markdown-header"'
                + '>'
                + text
                + '</h'
                + level
                + '>\n';
        }
        // ignore IDs
        return '<h' + level + '>' + text + '</h' + level + '>\n';
    },

    // Default renderer with a custom classname
    blockquote(quote: string) {
        return '<blockquote class="markdown-blockquote">\n' + quote + '</blockquote>\n';
    },

    // Default renderer with a custom classname
    hr(this: marked.Tokenizer) {
        return this.options.xhtml ? '<hr class="markdown-hr"/>\n' : '<hr class="markdown-hr">\n';
    },

    // Default renderer with a custom classname
    table(header: string, body: string) {
        if (body) body = '<tbody>' + body + '</tbody>';

        return '<table class="ui striped table">\n'
            + '<thead>\n'
            + header
            + '</thead>\n'
            + body
            + '</table>\n';
    },

    // Default renderer with a custom classname
    tablecell(content: string, flags: any) {
        const type = flags.header ? 'th' : 'td';
        // const className = ' class="markdown-' + type + '"';
        const tag = flags.align
            ? '<' + type /*+ className*/ + ' align="' + flags.align + '">'
            : '<' + type /*+ className*/ + '>';
    return tag + content + '</' + type + '>\n';
    },
    
    code(this: marked.Tokenizer, code: string, infostring: string, escaped: boolean) {
        // Formula code renderer
        const isFormula = code.match(rules.blockFormula);

        if (isFormula) {
            code = code.replace(/\$\$/g, "");
            const formula = katex.renderToString(code, { displayMode: true, output: "mathml", throwOnError: false });
            return "<p>" + formula + "</p>";
        }

        // Default code renderer with an added "hljs" classname required for highlighting
        const lang = ((infostring || '').match(/\S*/) || [])[0] || "";
        if (this.options.highlight) {
            const out = this.options.highlight(code, lang);
            if (out != null && out !== code) {
                escaped = true;
                code = out;
            }
        }

        if (!lang) {
            return '<pre><code class="hljs">'
                + (escaped ? code : escape(code, true))
                + '</code></pre>\n';
        }

        return '<pre><code class="'
            + this.options.langPrefix
            + escape(lang, true)
            + ' hljs'
            + '">'
            + (escaped ? code : escape(code, true))
            + '</code></pre>\n';
        },
  
    codespan(text: string) {
        // Inline formula renderer
        const isFormula = text.match(rules.inlineFormula);

        if (isFormula) {
            text = text.substring(1, text.length - 1).trim();
            const formula = katex.renderToString(text, { output: "mathml", throwOnError: false });
            return formula;
        }

        // Default inline code renderer with an added "hljs" classname required for highlighting
        return '<code class="hljs">' + text + '</code>';
    }
};


// Register white-listed languages in HLJS
// NOTE: to add highlighting of a language, add it and its dependencies to `hljs-used-languages.json` => rebuild the app.
HLJSUsedLanguages.forEach(lang => {
    // use eager mode for dynamic import to add imported modules into the current (worker) bundle
    import(/* webpackChunkName: 'hljs-language', webpackMode: 'eager' */ `highlight.js/lib/languages/${lang}`)
    .then(m => {
        hljs.registerLanguage(lang, m.default);
    });
});


/**
 * Add a code highlighting with Highlight.js
 * (an additional "hljs" classname must be added separately to \<code\> tags in order to apply styles them).
 */
// const highlight = (code) => hljs.highlightAuto(code).value;  // very slow
const highlight = (code: string, language: string) => {
    const validLanguage = hljs.getLanguage(language) ? language : "plaintext";
    return hljs.highlight(code, { language: validLanguage }).value;
};

// @ts-ignore (optional props for tokenizer & renderer overrides are declared as required in types)
marked.use({ tokenizer, renderer, highlight });
export default (text: string) => marked(text);
