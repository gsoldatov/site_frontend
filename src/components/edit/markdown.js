import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Grid } from "semantic-ui-react";

import FieldMenu from "../field/field-menu";

import { setEditedObject, setMarkdownDisplayMode } from "../../actions/object";
import { getCurrentObject, getEditedOrDefaultObjectSelector } from "../../store/state-util/ui-object";
import intervalWrapper from "../../util/interval-wrapper";

import ParseMarkdownWorker from "../../util/parse-markdown.worker";

import StyleMarkdown from "../../styles/markdown.css";
import StyleHighlight from "highlight.js/styles/a11y-dark.css";


/*
    Markdown-specific edit & view components
*/
export const MarkdownContainer = ({ objectID }) => {
    const objectSelector = useRef(getEditedOrDefaultObjectSelector(objectID)).current;

    const displayMode = useSelector(objectSelector).markdownDisplayMode;
    const viewEditBlock = displayMode === "view" ? <MarkdownView objectID={objectID} /> :
        displayMode === "edit" ? <MarkdownEdit objectID={objectID} /> : <MarkdownViewEdit objectID={objectID} />;
    const headerText = "Markdown " + (displayMode === "view" ? "(View)" :
        displayMode === "edit" ? "(Edit)" : "(View & Edit)");
    
    return (
        <div className="markdown-container">
            <div className="markdown-container-header">{headerText}</div>
            <MarkdownDisplaySwitch objectID={objectID} />
            <div className="markdown-view-edit-container">
                {viewEditBlock}
            </div>
        </div>
    )
};


const MarkdownDisplaySwitch = ({ objectID }) => {
    const objectSelector = useRef(getEditedOrDefaultObjectSelector(objectID)).current;

    const fieldMenuItems = useRef([
        {
            type: "item",
            icon: "square outline",
            title: "Display parsed markdown",
            onClick: setMarkdownDisplayMode,
            onClickParams: { objectID, markdownDisplayMode: "view" },
            isActiveSelector: state => objectSelector(state).markdownDisplayMode === "view"
        },
        {
            type: "item",
            icon: "pencil",
            title: "Display edit window",
            onClick: setMarkdownDisplayMode,
            onClickParams: { objectID, markdownDisplayMode: "edit" },
            isActiveSelector: state => objectSelector(state).markdownDisplayMode === "edit"
        },
        {
            type: "item",
            icon: "clone outline",
            title: "Display edit window and parsed markdown",
            onClick: setMarkdownDisplayMode,
            onClickParams: { objectID, markdownDisplayMode: "both" },
            isActiveSelector: state => objectSelector(state).markdownDisplayMode === "both"
        }
    ]).current;

    return <FieldMenu size="mini" compact className="markdown-display-switch-menu" items={fieldMenuItems} />;
};


const useMarkdownParseWorker = (objectID) => {
    const dispatch = useDispatch();

    // Delayed function, which parses markdown in a separate thread
    return useRef(intervalWrapper(raw => {
        const w = new ParseMarkdownWorker();
        w.onmessage = e => {    // Dispatch parsed text change & terminate worker after parsing is complete
            dispatch(setEditedObject({ markdown: { parsed: e.data }}, objectID));
            w.terminate();
        };

        w.postMessage(raw); // Start parsing
    }, 250, true)).current;
}


const MarkdownView = ({ objectID }) => {
    const objectSelector = useRef(getEditedOrDefaultObjectSelector(objectID)).current;

    const parseMarkdown = useMarkdownParseWorker();
    const text = useSelector(objectSelector).markdown.parsed;
    const rawText = useSelector(objectSelector).markdown.raw_text;

    useEffect(() => {   // Parse after first render
        if (text === undefined || text === "")
            parseMarkdown(rawText);
    }, []);

    return text && <div className="markdown-parsed-container" dangerouslySetInnerHTML={{ __html: text }} />;
};


const MarkdownEdit = ({ objectID }) => {
    const objectSelector = useRef(getEditedOrDefaultObjectSelector(objectID)).current;

    const dispatch = useDispatch();
    const rawText = useSelector(objectSelector).markdown.raw_text;

    const parseMarkdown = useMarkdownParseWorker();

    const handleDescriptionChange = useRef(e => {
        dispatch(setEditedObject({ markdown: { raw_text: e.target.value }}, objectID));
        
        if (rawTextRef.current) {
            rawTextRef.current.style.height = "inherit";  // Reset
            rawTextRef.current.style.height = rawTextRef.current.scrollHeight + "px";   // Set to text height
        }

        parseMarkdown(e.target.value);  // Trigger markdown parsing
    }).current;

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


const MarkdownViewEdit = ({ objectID }) => {
    return (
        <Grid>
            <Grid.Column width={8}>
                <MarkdownEdit objectID={objectID} />
            </Grid.Column>
            <Grid.Column width={8}>
                <MarkdownView objectID={objectID} />
            </Grid.Column>
        </Grid>
    );
};
