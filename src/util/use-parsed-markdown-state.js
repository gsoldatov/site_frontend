import { useState, useEffect, useMemo } from "react";

import { useMarkdownParseWorker } from "./use-markdown-parse-worker";
import { useMountedState } from "./use-mounted-state";


/**
 * Hooks for storing and managing parsed markdown. Renders provided raw markdown when it changes and, optionally runs provided function after render.
 * 
 * Returns current parsed Markdown.
 * 
 * Params:
 * - `rawMarkdown` - current raw Markdown;
 * - `renderParams` - an object with `onPostParse` execution params:
 *     - `onPostParse` - function, which is run after `rawMarkdown` change;
 *     - `runAfterComponentUnmount` - boolean, if true, `onPostParse` can be executed after component is unmounted, default is `false`;
 *     - `interval` - integer, minimal time interval between renders in ms, default is `250`;
 *     - `alwaysRunAfterInterval` - boolean, if true, first render is started after `interval`, otherwise it's started immediately after `rawMarkdown` is changed 
 *       (another render can be still executed only after `interval` time has passed), default is `false`.
 */
export const useParsedMarkdownState = (rawMarkdown, renderParams = {}) => {
    const { onPostParse, interval, alwaysRunAfterInterval } = renderParams;
    const runAfterComponentUnmount = "runAfterComponentUnmount" in renderParams ? renderParams.runAfterComponentUnmount : false;
    
    // isMounted hook and parsed Markdown state
    const isMounted = useMountedState();
    const [parsedMarkdown, setParsedMarkdown] = useState("");

    // Wrapped `onPostParse` callback with conditional execution and parsed Markdown state update
    const wrappedOnPostParse = useMemo(() => parsed => {
        if ((isMounted() || runAfterComponentUnmount) && typeof(onPostParse) === "function") onPostParse(parsed);
        if (isMounted()) setParsedMarkdown(parsed);
    }, [runAfterComponentUnmount, onPostParse]);

    const parseMarkdown = useMarkdownParseWorker(wrappedOnPostParse, interval, alwaysRunAfterInterval);
    
    useEffect(() => {
        // Run Markdown parse if `rawMarkdown` contains text
        if (rawMarkdown.length > 0) parseMarkdown(rawMarkdown);
        // Otherwise skip parsing and call `wrappedOnPostParse` directly
        else wrappedOnPostParse("");
    }, [rawMarkdown]);

    return parsedMarkdown;
};
