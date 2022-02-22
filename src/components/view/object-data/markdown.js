import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import ParseMarkdownWorker from "../../../util/parse-markdown.worker";
import { useMountedState } from "../../../util/use-mounted-state";


/**
 * Displays markdown object data in a <ObjectsViewCard> for the provided `objectID`.
 */
export const Markdown = ({ objectID }) => {
    const isMounted = useMountedState();
    const rawMarkdown = useSelector(state => state.markdown[objectID].raw_text);
    const [parsedMarkdown, setParsedMarkdown] = useState("");
    
    // Render markdown
    useEffect(() => {
        const w = new ParseMarkdownWorker();
        w.onmessage = e => {    // Set rendered markdown and terminate worker
            if (isMounted()) setParsedMarkdown(e.data);
            w.terminate();
        };

        w.postMessage(rawMarkdown); // Start parsing
    }, [objectID, rawMarkdown]);

    return parsedMarkdown.length > 0 && (
        <div className="objects-view-data markdown">
            <div className="rendered-markdown" dangerouslySetInnerHTML={{ __html: parsedMarkdown }} />
        </div>
    );
};
