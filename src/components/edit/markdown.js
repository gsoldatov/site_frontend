import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Grid, Menu } from "semantic-ui-react";

import { setCurrentObject, setMarkdownDisplayMode } from "../../actions/object";
import intervalWrapper from "../../util/interval-wrapper";

import ParseMarkdownWorker from "../../util/parse-markdown.worker";

import StyleMarkdown from "../../styles/markdown.css";
import StyleHighlight from "highlight.js/styles/a11y-dark.css";


/*
    Markdown-specific edit & view components
*/
export const MarkdownContainer = () => {
    const displayMode = useSelector(state => state.objectUI.markdownDisplayMode);
    const viewEditBlock = displayMode === "view" ? <MarkdownView /> :
        displayMode === "edit" ? <MarkdownEdit /> : <MarkdownViewEdit />;
    const headerText = "Markdown " + (displayMode === "view" ? "(View)" :
        displayMode === "edit" ? "(Edit)" : "(View & Edit)");
    
    return (
        <div className="markdown-container">
            <div className="markdown-container-header">{headerText}</div>
            <MarkdownDisplaySwitch />
            <div className="markdown-view-edit-container">
                {viewEditBlock}
            </div>
        </div>
    )
};


const MarkdownDisplaySwitch = () => {
    const dispatch = useDispatch();
    const markdownDisplayMode = useSelector(state => state.objectUI.markdownDisplayMode);

    const items = displayModeItems.map(i => {
        const isActive = markdownDisplayMode === i.mode;
        const className = isActive ? "acitve markdown-display-switch-menu-item" : "markdown-display-switch-menu-item";
        return <Menu.Item as="div" key={i.key} className={className} title={i.title} icon={i.icon} onClick={() => dispatch(i.action)} />;
    });
    
    return (
        <Menu compact size="tiny" className="markdown-display-switch-menu">
            {items}
        </Menu>
    );
};


const displayModeItems = [
    { key: 1, mode: "view", title: "Display parsed markdown", icon: "square outline", action: setMarkdownDisplayMode("view") },
    { key: 2, mode: "edit", title: "Display edit window", icon: "pencil", action: setMarkdownDisplayMode("edit") },
    { key: 3, mode: "both", title: "Display edit window and parsed markdown", icon: "clone outline", action: setMarkdownDisplayMode("both") }
];


const useMarkdownParseWorker = () => {
    const dispatch = useDispatch();

    // Delayed function, which parses markdown in a separate thread
    return useRef(intervalWrapper(raw => {
        const w = new ParseMarkdownWorker();
        w.onmessage = e => {    // Dispatch parsed text change & terminate worker after parsing is complete
            dispatch(setCurrentObject({ markdown: { parsed: e.data }}));
            w.terminate();
        };

        w.postMessage(raw); // Start parsing
    }, 250, true)).current;
}


const MarkdownView = () => {
    const parseMarkdown = useMarkdownParseWorker();
    const text = useSelector(state => state.objectUI.currentObject.markdown.parsed);
    const rawText = useSelector(state => state.objectUI.currentObject.markdown.raw_text);

    useEffect(() => {   // Parse after first render
        if (text === undefined || text === "")
            parseMarkdown(rawText);
    }, []);

    return text && <div className="markdown-parsed-container" dangerouslySetInnerHTML={{ __html: text }} />;
};


const MarkdownEdit = () => {
    const dispatch = useDispatch();
    const rawText = useSelector(state => state.objectUI.currentObject.markdown.raw_text);

    const parseMarkdown = useMarkdownParseWorker();

    const handleDescriptionChange = e => {
        dispatch(setCurrentObject({ markdown: { raw_text: e.target.value }}));
        
        if (rawTextRef.current) {
            rawTextRef.current.style.height = "inherit";  // Reset
            rawTextRef.current.style.height = rawTextRef.current.scrollHeight + "px";   // Set to text height
        }

        parseMarkdown(e.target.value);  // Trigger markdown parsing
    };

    const rawTextRef = useRef(null);
    
    return (
        <Form>
            <Form.Field>
                {/* <label>Raw Markdown</label> */}
                <textarea className="edit-page-textarea" placeholder="Enter text here..." ref={rawTextRef} value={rawText} onChange={handleDescriptionChange} />
            </Form.Field>
        </Form>
    );
};


const MarkdownViewEdit = () => {
    return (
        <Grid>
            <Grid.Column width={8}>
                <MarkdownEdit />
            </Grid.Column>
            <Grid.Column width={8}>
                <MarkdownView />
            </Grid.Column>
        </Grid>
    );
};
