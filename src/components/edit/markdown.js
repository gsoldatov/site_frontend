import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form } from "semantic-ui-react";

import FieldMenu from "../field/field-menu";
import { OnResizeWrapper } from "../common/on-resize-wrapper";

import { setEditedObject, setMarkdownDisplayMode } from "../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../store/state-util/ui-objects-edit";
import intervalWrapper from "../../util/interval-wrapper";

import ParseMarkdownWorker from "../../util/parse-markdown.worker";

import StyleMarkdown from "../../styles/markdown.css";
import StyleHighlight from "highlight.js/styles/a11y-dark.css";


/**
 * Markdown data edit & view component.
 */
export const MarkdownContainer = memo(({ objectID }) => {
    const editedOrDefaultObjectSelector = useMemo(() => getEditedOrDefaultObjectSelector(objectID), [objectID]);
    const displayModeSelector = useMemo(() => state => editedOrDefaultObjectSelector(state).markdownDisplayMode, [objectID]);
    const displayMode = useSelector(displayModeSelector);
    const viewEditBlock = displayMode === "view" ? <MarkdownView objectID={objectID} /> :
        displayMode === "edit" ? <MarkdownEdit objectID={objectID} /> : <MarkdownViewEdit objectID={objectID} />;
    const headerText = "Markdown " + (displayMode === "view" ? "(View)" :
        displayMode === "edit" ? "(Edit)" : "(View & Edit)");
    
    return (
        <div className="markdown-container">
            <div className="markdown-container-header">{headerText}</div>
            <MarkdownDisplaySwitch objectID={objectID} />
            <div className="markdown-display-container">
                {viewEditBlock}
            </div>
        </div>
    )
});


const MarkdownDisplaySwitch = memo(({ objectID }) => {
    const fieldMenuItems = useMemo(() => [
        {
            type: "item",
            icon: "square outline",
            title: "Display parsed markdown",
            onClick: setMarkdownDisplayMode,
            onClickParams: { objectID, markdownDisplayMode: "view" },
            isActiveSelector: state => getEditedOrDefaultObjectSelector(objectID)(state).markdownDisplayMode === "view"
        },
        {
            type: "item",
            icon: "pencil",
            title: "Display edit window",
            onClick: setMarkdownDisplayMode,
            onClickParams: { objectID, markdownDisplayMode: "edit" },
            isActiveSelector: state => getEditedOrDefaultObjectSelector(objectID)(state).markdownDisplayMode === "edit"
        },
        {
            type: "item",
            icon: "clone outline",
            title: "Display edit window and parsed markdown",
            onClick: setMarkdownDisplayMode,
            onClickParams: { objectID, markdownDisplayMode: "both" },
            isActiveSelector: state => getEditedOrDefaultObjectSelector(objectID)(state).markdownDisplayMode === "both"
        }
    ], [objectID]);

    return <FieldMenu size="mini" compact className="markdown-display-switch-menu" items={fieldMenuItems} />;
});


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
    const parseMarkdown = useMarkdownParseWorker(objectID);

    const editedOrDefaultObjectSelector = useMemo(() => getEditedOrDefaultObjectSelector(objectID), [objectID]);
    const rawTextSelector = useMemo(() => state => editedOrDefaultObjectSelector(state).markdown.raw_text, [objectID]);
    const textSelector = useMemo(() => state => editedOrDefaultObjectSelector(state).markdown.parsed, [objectID]);

    const rawText = useSelector(rawTextSelector);
    const text = useSelector(textSelector);

    useEffect(() => {   // Parse after first render
        if (text === undefined || text === "")
            parseMarkdown(rawText);
    }, []);

    return text && <div className="markdown-parsed-container" dangerouslySetInnerHTML={{ __html: text }} />;
};


const MarkdownEdit = ({ objectID }) => {
    const dispatch = useDispatch();

    const editedOrDefaultObjectSelector = useMemo(() => getEditedOrDefaultObjectSelector(objectID), [objectID]);
    const rawTextSelector = useMemo(() => state => editedOrDefaultObjectSelector(state).markdown.raw_text, [objectID]);
    const rawText = useSelector(rawTextSelector);

    const parseMarkdown = useMarkdownParseWorker(objectID);

    // Resize
    const resize = useRef(() => {
        if (rawTextRef.current) {
            rawTextRef.current.style.height = "inherit";  // Reset
            rawTextRef.current.style.height = rawTextRef.current.scrollHeight + "px";   // Set to text height
        }
    }).current;

    // Resize after first render
    useEffect(() => { resize(); }, []);


    // On text change
    const handleChange = useRef(e => {
        dispatch(setEditedObject({ markdown: { raw_text: e.target.value }}, objectID));
        resize();
        parseMarkdown(e.target.value);  // Trigger markdown parsing
    }).current;

    const rawTextRef = useRef(null);
    
    return (
        <Form className="markdown-edit-form">
            <Form.Field>
                {/* <label>Raw Markdown</label> */}
                <textarea className="edit-page-textarea" placeholder="Enter text here..." ref={rawTextRef} value={rawText} onChange={handleChange} />
            </Form.Field>
        </Form>
    );
};


const MarkdownViewEdit = ({ objectID }) => {
    // Fullscreen style state
    const [isFullscreenStyle, setIsFullscreenStyle] = useState(true);
    const containerClassName = isFullscreenStyle ? "markdown-view-edit-container" : "markdown-view-edit-container small";
    const columnClassName = isFullscreenStyle ? "markdown-view-edit-item" : "markdown-view-edit-item small";

    const onResizeCallback = useMemo(() => containerRef => {
        const width = parseInt(getComputedStyle(containerRef).width.replace("px", ""));
        setIsFullscreenStyle(width >= 500);
    });

    return (
        <OnResizeWrapper callback={onResizeCallback}>
            <div className={containerClassName}>
                <div className={columnClassName}>
                    <MarkdownEdit objectID={objectID} />
                </div>
                <div className={columnClassName}>
                    <MarkdownView objectID={objectID} />
                </div>
            </div>
        </OnResizeWrapper>
    );

    // return (
    //     <Grid>
    //         <Grid.Column width={8}>
    //             <MarkdownEdit objectID={objectID} />
    //         </Grid.Column>
    //         <Grid.Column width={8}>
    //             <MarkdownView objectID={objectID} />
    //         </Grid.Column>
    //     </Grid>
    // );
};
