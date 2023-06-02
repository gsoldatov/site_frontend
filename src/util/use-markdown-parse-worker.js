import { useMemo } from "react";

import ParseMarkdownWorker from "./parse-markdown.worker";
import debounce from "./debounce";
import { enumDebounceDelayRefreshMode } from "./enum-debounce-delay-refresh-mode";


/**
 * Hook for rendering markdown in a worker thread.
 * 
 * @param {function} onPostParse - callback to be called with parsed markdown as an argument.
 * @param {number} [delay=250] - delay in milliseconds between parses.
 * @param {boolean} [refreshDelayMode=false] - flag indicating if delay for the next parse is reset when raw markdown changes.
 * @return {function} debounced function which accepts raw markdown, parses it in a worker and calls `onPostParse` callback after that.
 */
export const useMarkdownParseWorker = (onPostParse, delay = 250, refreshDelayMode = enumDebounceDelayRefreshMode.noRefreshOnFirstCall) => {
    // Delayed function, which parses markdown in a separate thread
    return useMemo(() => debounce(rawMarkdown => {
        const w = new ParseMarkdownWorker();
        w.onmessage = e => {
            // Run `onPostParse` function & terminate worker after parsing is complete
            onPostParse(e.data);
            w.terminate();
        };

        w.postMessage(rawMarkdown); // Start parsing
    }, delay, refreshDelayMode), [onPostParse, delay, refreshDelayMode]);
};
