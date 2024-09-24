import parse from "../../src/util/markdown-parser";


test("Headers + check rendering", () => {
    // Check if headers are properly processed by Markdown parser; check if header levels are increased by 2 & a custom class is added to them
    [1, 2, 3].forEach(i => {
        const parsed = parse(`${"#".repeat(i)} Header`);
        const re = new RegExp(`<h${i+2}[\\s\\S]+class="(?<classNames>[^"]+)"[\\s\\S]*>Header<\\/h${i+2}>`);
        const match = parsed.match(re);
        expect(match).toBeTruthy();
        expect(match.groups.classNames.indexOf("markdown-header")).toBeGreaterThan(-1);
    });

    [4, 5, 6].forEach(i => {
        const parsed = parse(`${"#".repeat(i)} Header`);
        const re = new RegExp(`<h6[\\s\\S]+class="(?<classNames>[^"]+)"[\\s\\S]*>Header<\\/h6>`);
        const match = parsed.match(re);
        expect(match).toBeTruthy();
        expect(match.groups.classNames.indexOf("markdown-header")).toBeGreaterThan(-1);
    });
});


test("Blockquote", () => {
    // Check if a custom class is added to a blockquote
    const parsed = parse("> A Blockquote");
    const re = new RegExp(`<blockquote[\\s\\S]+class="(?<classNames>[^"]+)"[\\s\\S]*>`);
    const match = parsed.match(re);
    expect(match).toBeTruthy();
    expect(match.groups.classNames.indexOf("markdown-blockquote")).toBeGreaterThan(-1);
});


test("Horizontal rule", () => {
    // Check if a custom class is added to a horizontal rule
    const parsed = parse("Text before hr\n\n---\n\nText after hr");
    const re = new RegExp(`<hr[\\s\\S]+class="(?<classNames>[^"]+)"[\\s\\S]*>`);
    const match = parsed.match(re);
    expect(match).toBeTruthy();
    expect(match.groups.classNames.indexOf("markdown-hr")).toBeGreaterThan(-1);
});


test("Table & tablecells", () => {
    // Check if SUIR classes are added to table, th & td tags
    const parsed = parse("| Col1 | Col2 |\n| --- | --- |\n| Cell1 | Cell2 |");
    const re = new RegExp(`<table[\\s\\S]+?class="(?<classNames>[^"]+)"[\\s\\S]*?>`);
    const match = parsed.match(re);
    expect(match).toBeTruthy();
    ["ui", "table", "striped"].forEach(className => {
        expect(match.groups.classNames.indexOf(className)).toBeGreaterThan(-1);
    });

    // // Check if custom classes are added to table, th & td tags      (old check for non-SUIR classname)
    // const parsed = parse("| Col1 | Col2 |\n| --- | --- |\n| Cell1 | Cell2 |");
    // ["table", "th", "td"].forEach(tag => {
    //     const re = new RegExp(`<${tag}[\\s\\S]+?class="(?<classNames>[^"]+)"[\\s\\S]*?>`);
    //     const match = parsed.match(re);
    //     expect(match).toBeTruthy();
    //     expect(match.groups.classNames.indexOf(`markdown-${tag}`)).toBeGreaterThan(-1);
    // });
});


test("Block code", () => {
    // Block code is rendered and has "hljs" + language classes added to it
    const parsed = parse("```python\ndef main():\n    print(\"Hello, World\")\n```");
    const re = new RegExp(`<pre><code[\\s\\S]+?class="(?<classNames>[^"]+)"[\\s\\S]*?>`);
    const match = parsed.match(re);
    expect(match).toBeTruthy();
    expect(match.groups.classNames.indexOf("hljs")).toBeGreaterThan(-1);
    expect(match.groups.classNames.indexOf("python")).toBeGreaterThan(-1);
});


test("Inline code", () => {
    // Inline code is rendered regardless of its position in a paragraph and has an "hljs" class added to it
    const re = new RegExp(`<code[\\s\\S]+?class="(?<classNames>[^"]+)"[\\s\\S]*?>[^<]*<\\/code>`);
    ["`const x = 5;`", "Text before code `const x = 5;`", "`const x = 5;` text after code", "Text before code `const x = 5;` text after code"].forEach(raw => {
        const parsed = parse(raw);
        const match = parsed.match(re);
        expect(match).toBeTruthy();
        expect(match.groups.classNames.indexOf("hljs")).toBeGreaterThan(-1);
    });
});


test("Block formula", () => {
    // Block formula is rendered and allows usage of escaped dollar-signs
    const parsed = parse("$$\n \\alpha = \\beta \\$\\$\n$$");
    const re = new RegExp(`<span[\\s\\S]+?class="(?<classNames>[^"]+)"[\\s\\S]*?>[\s\S]*<annotation`);  // raw formula is placed in an <annotation> tag, and dollar-signs should not be searched insed
    const match = parsed.match(re);
    expect(match).toBeTruthy();
    expect(match.groups.classNames.indexOf("katex")).toBeGreaterThan(-1);
    expect(match[0].match(/\$/g).length).toEqual(2);
});


test("Inline code", () => {
    // Inline formula is rendered regardless of its position in a paragraph and allows usage of escaped dollar-signs
    const re = new RegExp(`<span[\\s\\S]+?class="(?<classNames>[^"]+)"[\\s\\S]*?>[\s\S]*<annotation`);  // raw formula is placed in an <annotation> tag, and dollar-signs should not be searched insed
    ["$ \\alpha = \\beta \\$ \\$ $", "Text before code $ \\alpha = \\beta \\$ \\$ $", "$ \\alpha = \\beta \\$ \\$ $ text after code", "Text before code $ \\alpha = \\beta \\$ \\$ $ text after code"].forEach(raw => {
        const parsed = parse(raw);
        const match = parsed.match(re);
        expect(match.groups.classNames.indexOf("katex")).toBeGreaterThan(-1);
        expect(match[0].match(/\$/g).length).toEqual(2);
    });
});
