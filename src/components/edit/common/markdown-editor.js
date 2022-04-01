import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { Form } from "semantic-ui-react";

import { FieldMenu, FieldMenuGroup, FieldMenuButton } from "../../field/field-menu";
import { OnResizeWrapper } from "../../common/on-resize-wrapper";

import intervalWrapper from "../../../util/interval-wrapper";

import ParseMarkdownWorker from "../../../util/parse-markdown.worker";

import StyleMarkdownEditor from "../../../styles/markdown-editor.css";
import StyleRenderedMarkdown from "../../../styles/rendered-markdown.css";
import StyleHighlight from "highlight.js/styles/a11y-dark.css";


/**
 * Customizable markdown editor component.
 * Displays markdown edit form and rendered markdown.
 */
export const MarkdownEditor = memo(({ headerText, rawMarkdown, rawMarkdownOnChange, parsedMarkdown, onPostParse }) => {
    const [displayMode, setDisplayMode] = useState("both");

    const header = headerText && (
        <div className="markdown-editor-header">{headerText}</div>
    );
    
    return (
        <div className="markdown-editor-container">
            {header}
            <MarkdownEditorDisplayModeMenu displayMode={displayMode} setDisplayMode={setDisplayMode} />
            <MarkdownEditorViewEdit displayMode={displayMode} rawMarkdown={rawMarkdown} rawMarkdownOnChange={rawMarkdownOnChange} 
                parsedMarkdown={parsedMarkdown} onPostParse={onPostParse} />
        </div>
    );
});


const MarkdownEditorDisplayModeMenu = memo(({ displayMode, setDisplayMode }) => {
    // `View` button props
    const viewOnClick = useMemo(() => () => setDisplayMode("view"), []);
    const viewIsActive = displayMode === "view";

    // `Edit` button props
    const editOnClick = useMemo(() => () => setDisplayMode("edit"), []);
    const editIsActive = displayMode === "edit";

    // `Both` button props
    const bothOnClick = useMemo(() => () => setDisplayMode("both"), []);
    const bothIsActive = displayMode === "both";
    
    return (
        <FieldMenu className="markdown-editor-display-mode-menu" size="mini" compact>
            <FieldMenuGroup isButtonGroup>
                <FieldMenuButton icon="square outline" title="Display parsed markdown" onClick={viewOnClick} isActive={viewIsActive} />
                <FieldMenuButton icon="pencil" title="Display edit window" onClick={editOnClick} isActive={editIsActive} />
                <FieldMenuButton icon="clone outline" title="Display edit window and parsed markdown" onClick={bothOnClick} isActive={bothIsActive} />
            </FieldMenuGroup>
        </FieldMenu>
    );
});


const useMarkdownParseWorker = onPostParse => {
    // Delayed function, which parses markdown in a separate thread
    return useRef(intervalWrapper(rawMarkdown => {
        const w = new ParseMarkdownWorker();
        w.onmessage = e => {
            // Run `onPostParse` function & terminate worker after parsing is complete
            onPostParse(e.data);
            w.terminate();
        };

        w.postMessage(rawMarkdown); // Start parsing
    }, 250, true)).current;
};


const MarkdownEditorViewEdit = ({ displayMode, rawMarkdown, rawMarkdownOnChange, parsedMarkdown, onPostParse }) => {
    // Fullscreen style state & on resize callback
    const [isFullscreenStyle, setIsFullscreenStyle] = useState(true);

    const onResizeCallback = useMemo(() => containerRef => {
        const width = parseInt(getComputedStyle(containerRef).width.replace("px", ""));
        setIsFullscreenStyle(width >= 500);
    }, []);

    // Trigger markdown parse after first render or when raw
    const parseMarkdown = useMarkdownParseWorker(onPostParse);
    
    useEffect(() => {
        parseMarkdown(rawMarkdown);
    }, [rawMarkdown]);

    // View & edit containers
    const containerClassName = "markdown-editor-view-edit-container".concat(isFullscreenStyle ? "" : " smallscreen");
    const columnClassName = "markdown-editor-column".concat(isFullscreenStyle ? "" : " smallscreen");

    const editContainer = displayMode !== "view" && (
        <div className={columnClassName}>
            <MarkdownEdit rawMarkdown={rawMarkdown} rawMarkdownOnChange={rawMarkdownOnChange} />
        </div>
    );
    
    const viewContainer = displayMode !== "edit" && (
        <div className={columnClassName}>
            <MarkdownView parsedMarkdown={parsedMarkdown} />
        </div>
    );

    return (
        <OnResizeWrapper callback={onResizeCallback}>
            <div className={containerClassName}>
                {editContainer}
                {viewContainer}
            </div>
        </OnResizeWrapper>
    );
};


const MarkdownView = memo(({ parsedMarkdown }) => {
    return parsedMarkdown && (
        <div className="markdown-editor-view-container">
            <div className="rendered-markdown" dangerouslySetInnerHTML={{ __html: parsedMarkdown }} />
        </div>
    );
});


const MarkdownEdit = ({ rawMarkdown, rawMarkdownOnChange }) => {
    // Resize function
    const resize = useRef(() => {
        if (rawMarkdownRef.current) {
            rawMarkdownRef.current.style.height = "inherit";  // Reset
            rawMarkdownRef.current.style.height = rawMarkdownRef.current.scrollHeight + "px";   // Set to text height
        }
    }).current;

    // Resize after first render
    useEffect(() => { resize(); }, []);

    // On raw markdown change
    const handleChange = useRef(e => {
        rawMarkdownOnChange(e.target.value);
        resize();
    }).current;

    const rawMarkdownRef = useRef(null);
    
    return (
        <Form className="markdown-editor-edit-container">
            <Form.Field>
                <textarea className="edit-page-textarea" placeholder="Enter text here..." ref={rawMarkdownRef} value={rawMarkdown} onChange={handleChange} />
            </Form.Field>
        </Form>
    );
};
