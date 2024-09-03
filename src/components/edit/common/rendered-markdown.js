import React, { useRef, useEffect } from "react";

import { addImageOnClickHandlers } from "../../../util/markdown-postprocessing";


/**
 * Renders provided parsed `parsedMarkdown` in a container & applies post-render processing over it.
 */
export const RenderedMarkdown = ({ parsedMarkdown }) => {
    const containerRef = useRef(null);

    // Process container children after they're rendered
    useEffect(() => {
        if (containerRef.current) {
            // add onClick handlers to images
            addImageOnClickHandlers(containerRef.current);
        }
    }, [parsedMarkdown]);

    return (
        <div className="rendered-markdown" ref={containerRef} dangerouslySetInnerHTML={{ __html: parsedMarkdown }} />
    );
};
