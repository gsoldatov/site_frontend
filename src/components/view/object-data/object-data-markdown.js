import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import ParseMarkdownWorker from "../../../util/parse-markdown.worker";


/**
 * Markdown object data display component on the /objects/view/:id page.
 */
export const ObjectDataMarkdown = ({ objectID }) => {
    const rawMarkdown = useSelector(state => state.markdown[objectID].raw_text);
    const [parsedMarkdown, setParsedMarkdown] = useState("");
    
    // Render markdown
    useEffect(() => {
        const w = new ParseMarkdownWorker();
        w.onmessage = e => {    // Set rendered markdown and terminate worker
            setParsedMarkdown(e.data);
            w.terminate();
        };

        w.postMessage(rawMarkdown); // Start parsing
    }, [objectID, rawMarkdown]);

    return parsedMarkdown.length > 0 && (
        <div className="objects-view-data markdown">
            <div dangerouslySetInnerHTML={{ __html: parsedMarkdown }} />
        </div>
    );
};
