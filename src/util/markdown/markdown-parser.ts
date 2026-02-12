import { Marked, Tokenizer, Tokens, Renderer } from "marked";
import { markedHighlight } from "marked-highlight";

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

import { rules, escape } from "./util";


/**
 * Markdown parser setup. 
 */
const tokenizer = {
    /**
     * Tokenize block formulas ($$ ... $$) as code
     */
    code(src: string): Tokens.Code | false {
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
    
    /**
     * Tokenize inline block formulas ($ ... $) as a codespan
     */
    codespan(src: string): Tokens.Codespan | false {
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

    /**
     * Default inline text tokenizer with an additional rule for stopping before inline formulas
     */
    inlineText(this: Tokenizer, src: string, inRawBlock: boolean, smartypants: any): Tokens.Text | undefined {
        const cap = rules.inlineText.exec(src);
        if (cap) {
            const escaped = this.lexer.state.inRawBlock;
            return {
                type: 'text',
                raw: cap[0],
                text: cap[0],
                escaped,
            };
        }
    }
};


const renderer = {
    /**
     * Modified default heading renderer which adds +2 to header levels and adds a classname
     */
    heading(this: Renderer, { tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens);
        const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
        depth = Math.min(depth + 2, 6);

        return (
            `<h${depth} class="markdown-header">` +
                `${text}` +
            `</h${depth}>`
        );
    },

    /**
     * Default renderer with a custom classname
     */
    blockquote(this: Renderer, { tokens }: Tokens.Blockquote) {
        const body = this.parser.parse(tokens);
        return (
            '<blockquote class="markdown-blockquote">' +
                `${body}` +
            '</blockquote>'
        );
    },

    /**
     * Default renderer with a custom classname
     */
    hr(token: Tokens.Hr) {
        return '<hr class="markdown-hr">\n';
    },

    /**
     * Default renderer with a custom classname
     */
    table(this: Renderer, token: Tokens.Table) {
        let header = '';

        // header
        let cell = '';
        for (let j = 0; j < token.header.length; j++) {
        cell += this.tablecell(token.header[j]);
        }
        header += this.tablerow({ text: cell });

        let body = '';
        for (let j = 0; j < token.rows.length; j++) {
        const row = token.rows[j];

        cell = '';
        for (let k = 0; k < row.length; k++) {
            cell += this.tablecell(row[k]);
        }

        body += this.tablerow({ text: cell });
        }
        if (body) body = `<tbody>${body}</tbody>`;

        return '<table class="ui striped table">\n'
        + '<thead>\n'
        + header
        + '</thead>\n'
        + body
        + '</table>\n';
    },

    /**
     * Render block KaTeX formulae
     */
    code(this: Renderer,{ text, lang, escaped }: Tokens.Code) {
        // Default code renderer start (with patterns being)
        let code = text.replace(rules.endingNewline, '') + '\n';

        // Formula code renderer
        const isFormula = code.match(rules.blockFormula);

        if (isFormula) {
            code = code.replace(/\$\$/g, "");
            const formula = katex.renderToString(code, { displayMode: true, output: "mathml", throwOnError: false });
            return "<p>" + formula + "</p>";
        }

        // Use default renderer for code blocks (marked-highlight handles addition of CSS classnames)
        return false;
    },

    /**
     * Render inline KaTeX formulae & add highlight.js CSS class name to codespans
     */
    codespan({ text }: Tokens.Codespan) {
        // Inline formula renderer
        const isFormula = text.match(rules.inlineFormula);

        if (isFormula) {
            text = text.substring(1, text.length - 1).trim();
            const formula = katex.renderToString(text, { output: "mathml", throwOnError: false });
            return formula;
        }

        // Default inline code renderer with an added "hljs" classname required for highlighting
        // (marked-highlight does not process codespans)
        return `<code class="hljs">${escape(text, true)}</code>`;
    },
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
 * Use marked-highlight extension to add highlighting for code blocks.
 * (NOTE: inline code spans are not processed by it)
 */
const marked = new Marked(
    markedHighlight({
        emptyLangClass: "hljs",
        langPrefix: "hljs language-",
        highlight(code, lang, info) {
            const language = hljs.getLanguage(lang) ? lang : "plaintext";
            return hljs.highlight(code, { language }).value;
        }
    })
);

// @ts-ignore
marked.use({ tokenizer, renderer });
export default (text: string) => marked.parse(text);
