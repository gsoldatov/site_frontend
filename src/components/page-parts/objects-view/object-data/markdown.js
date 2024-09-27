import React from "react";
import { useSelector } from "react-redux";

import { RenderedMarkdown } from "../../../modules/markdown/rendered-markdown";

import { useParsedMarkdownState } from "../../../../util/use-parsed-markdown-state";

import StyleObjectsViewMarkdown from "../../../../styles/pages/objects-view/markdown.css";


/**
 * Displays markdown object data in a <ObjectsViewCard> for the provided `objectID`.
 */
export const Markdown = ({ objectID }) => {
    // Raw markdown
    const rawMarkdown = useSelector(state => state.markdown[objectID].raw_text);

    // Parsed Markdown state
    const parsedMarkdown = useParsedMarkdownState(rawMarkdown);

    // CSS classnames
    const objectDescription = useSelector(state => (state.objects[objectID] || {}).object_description);
    const className = "objects-view-data markdown" + (objectDescription.length === 0 ? " no-description" : "");

    // Result
    return parsedMarkdown.length > 0 && (
        <div className={className}>
            <RenderedMarkdown parsedMarkdown={parsedMarkdown} />
        </div>
    );
};
