import { useRef } from "react";

import ParseMarkdownWorker from "./parse-markdown.worker";
import intervalWrapper from "./interval-wrapper";


/**
 * Hook for rendering markdown in a worker thread.
 * 
 * Returns a function, which accepts raw markdown, renders it and passes it into `onPostParse`, provided as a hook argument.
 */
export const useMarkdownParseWorker = onPostParse => {
    // Delayed function, which parses markdown in a separate thread
    return useRef(intervalWrapper(rawMarkdown => {
        const w = new ParseMarkdownWorker();
        w.onmessage = e => {
            // Run `onPostParse` function & terminate worker after parsing is complete
            onPostParse(e.data);
            w.terminate();
        };

        w.postMessage(rawMarkdown); // Start parsing
    }, 250, true)).current;
};
