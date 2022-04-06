import { useMemo } from "react";

import ParseMarkdownWorker from "./parse-markdown.worker";
import intervalWrapper from "./interval-wrapper";


/**
 * Hook for rendering markdown in a worker thread.
 * 
 * Returns a function, which accepts raw markdown, renders it and passes it into `onPostParse`, provided as a hook argument.
 * `interval` - integer, minimal time interval between renders in ms, default is `250`;
 * `alwaysRunAfterInterval` - boolean, if true, first render is started after `interval`, otherwise it's started immediately after `rawMarkdown` is changed 
 *  (another render can be still executed only after `interval` time has passed), default is `false`.
 */
export const useMarkdownParseWorker = (onPostParse, interval = 250, alwaysRunAfterFirstInterval = false) => {
    // Delayed function, which parses markdown in a separate thread
    return useMemo(() => intervalWrapper(rawMarkdown => {
        const w = new ParseMarkdownWorker();
        w.onmessage = e => {
            // Run `onPostParse` function & terminate worker after parsing is complete
            onPostParse(e.data);
            w.terminate();
        };

        w.postMessage(rawMarkdown); // Start parsing
    }, interval, alwaysRunAfterFirstInterval), [onPostParse, interval, alwaysRunAfterFirstInterval]);
};
