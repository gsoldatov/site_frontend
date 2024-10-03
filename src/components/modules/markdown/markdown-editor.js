import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { Form } from "semantic-ui-react";

import { HorizontalMenu, HorizontalMenuGroup, HorizontalMenuButton } from "../horizontal-menu";
import { OnResizeWrapper } from "../wrappers/on-resize-wrapper";
import { RenderedMarkdown } from "./rendered-markdown";

import { useMarkdownParseWorker } from "../../../util/use-markdown-parse-worker";
import { useMountedState } from "../../../util/use-mounted-state";

import StyleMarkdownEditor from "../../../styles/modules/markdown/editor.css";
import StyleRenderedMarkdown from "../../../styles/modules/markdown/rendered.css";
import StyleHighlight from "highlight.js/styles/vs2015.css";


/**
 * Customizable markdown editor component.
 * Displays markdown edit form and rendered markdown.
 */
export const MarkdownEditor = memo(({ header, editPlaceholder, rawMarkdown, rawMarkdownOnChange, parsedMarkdown, onPostParse }) => {
    const [displayMode, setDisplayMode] = useState("both");

    const _header = header && (
        <div className="markdown-editor-header">{header}</div>
    );
    
    return (
        <div className="markdown-editor-container">
            {_header}
            <MarkdownEditorDisplayModeMenu displayMode={displayMode} setDisplayMode={setDisplayMode} />
            <MarkdownEditorViewEdit displayMode={displayMode} editPlaceholder={editPlaceholder} rawMarkdown={rawMarkdown} rawMarkdownOnChange={rawMarkdownOnChange} 
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
        <HorizontalMenu className="markdown-editor-display-mode-menu" size="mini" compact>
            <HorizontalMenuGroup isButtonGroup>
                <HorizontalMenuButton icon="square outline" title="Display parsed markdown" onClick={viewOnClick} isActive={viewIsActive} />
                <HorizontalMenuButton icon="pencil" title="Display edit window" onClick={editOnClick} isActive={editIsActive} />
                <HorizontalMenuButton icon="clone outline" title="Display edit window and parsed markdown" onClick={bothOnClick} isActive={bothIsActive} />
            </HorizontalMenuGroup>
        </HorizontalMenu>
    );
});


const MarkdownEditorViewEdit = ({ displayMode, editPlaceholder, rawMarkdown, rawMarkdownOnChange, parsedMarkdown, onPostParse }) => {
    // isMounted state of the component
    const isMounted = useMountedState();

    // Fullscreen style state & on resize callback
    const [isFullscreenStyle, setIsFullscreenStyle] = useState(true);

    const onResizeCallback = useMemo(() => containerRef => {
        const width = parseInt(getComputedStyle(containerRef).width.replace("px", ""));
        setIsFullscreenStyle(width >= 500);
    }, []);

    // Trigger markdown parse after first render or when raw
    // Also check if current component is mounted to avoid updating state of unmounted components
    const onPostParse_ = useMemo(() => parsed => {
        if (isMounted()) onPostParse(parsed)
    }, [isMounted, onPostParse]);
    const parseMarkdown = useMarkdownParseWorker(onPostParse_);
    
    useEffect(() => { parseMarkdown(rawMarkdown); }, [rawMarkdown]);

    // View & edit containers
    const containerClassName = "markdown-editor-view-edit-container".concat(isFullscreenStyle ? "" : " smallscreen");
    const columnClassName = "markdown-editor-column".concat(isFullscreenStyle ? "" : " smallscreen");

    const editContainer = displayMode !== "view" && (
        <div className={columnClassName}>
            <MarkdownEdit placeholder={editPlaceholder} rawMarkdown={rawMarkdown} rawMarkdownOnChange={rawMarkdownOnChange} />
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
            <RenderedMarkdown parsedMarkdown={parsedMarkdown} />
        </div>
    );
});


const MarkdownEdit = ({ placeholder = "Enter text here...", rawMarkdown, rawMarkdownOnChange }) => {
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
                <textarea className="edit-page-textarea" placeholder={placeholder} ref={rawMarkdownRef} value={rawMarkdown} onChange={handleChange} />
            </Form.Field>
        </Form>
    );
};
