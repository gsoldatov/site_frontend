import marked from "marked";
// @ts-ignore (import from library subfolder results in no types being visible)
import { escape } from "marked/src/helpers";

// Import highlight.js library and white-listed languages to manually register them
import hljs from "highlight.js/lib/core";

import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import excel from "highlight.js/lib/languages/excel";
import go from "highlight.js/lib/languages/go";
import http from "highlight.js/lib/languages/http";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import lua from "highlight.js/lib/languages/lua";
import markdown from "highlight.js/lib/languages/markdown";
import nginx from "highlight.js/lib/languages/nginx";
import pgsql from "highlight.js/lib/languages/pgsql";
import plaintext from "highlight.js/lib/languages/plaintext";
import powershell from "highlight.js/lib/languages/powershell";
import python from "highlight.js/lib/languages/python";
import pythonRepl from "highlight.js/lib/languages/python-repl";
import ruby from "highlight.js/lib/languages/ruby";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

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

// Register HLJS languages, included in the bundle
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("css", css);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("excel", excel);
hljs.registerLanguage("go", go);
hljs.registerLanguage("http", http);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("nginx", nginx);
hljs.registerLanguage("pgsql", pgsql);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("powershell", powershell);
hljs.registerLanguage("python", python);
hljs.registerLanguage("python-repl", pythonRepl);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);


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
