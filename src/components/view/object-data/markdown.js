import React from "react";
import { useSelector } from "react-redux";

import { useParsedMarkdownState } from "../../../util/use-parsed-markdown-state";


/**
 * Displays markdown object data in a <ObjectsViewCard> for the provided `objectID`.
 */
export const Markdown = ({ objectID }) => {
    // Raw markdown
    const rawMarkdown = useSelector(state => state.markdown[objectID].raw_text);

    // Parsed Markdown state
    const parsedMarkdown = useParsedMarkdownState(rawMarkdown);

    // Result
    return parsedMarkdown.length > 0 && (
        <div className="objects-view-data markdown">
            <div className="rendered-markdown" dangerouslySetInnerHTML={{ __html: parsedMarkdown }} />
        </div>
    );
};
