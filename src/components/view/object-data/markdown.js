import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";

import { useMarkdownParseWorker } from "../../../util/use-markdown-parse-worker";
import { useMountedState } from "../../../util/use-mounted-state";


/**
 * Displays markdown object data in a <ObjectsViewCard> for the provided `objectID`.
 */
export const Markdown = ({ objectID }) => {
    // Raw markdown and resulting component
    const rawMarkdown = useSelector(state => state.markdown[objectID].raw_text);
    
    // isMounted hook and markdown parsing
    const isMounted = useMountedState();
    
    const [parsedMarkdown, setParsedMarkdown] = useState("");

    const onPostParse = useMemo(() => parserMarkdown => {
        if (isMounted()) setParsedMarkdown(parserMarkdown);
    }, []);

    const parseMarkdown = useMarkdownParseWorker(onPostParse);
    
    useEffect(() => { parseMarkdown(rawMarkdown); }, [rawMarkdown]);

    return parsedMarkdown.length > 0 && (
        <div className="objects-view-data markdown">
            <div className="rendered-markdown" dangerouslySetInnerHTML={{ __html: parsedMarkdown }} />
        </div>
    );
};
