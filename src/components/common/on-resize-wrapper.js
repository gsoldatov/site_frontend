import React, { useRef, useLayoutEffect, useMemo } from "react";

import { Ref } from "semantic-ui-react";

import intervalWrapper from "../../util/interval-wrapper";


/**
 * Wrapper component, which fires (with debouncing) provided `callback` when resize of its child occures and passes computed style into it.
 */
export const OnResizeWrapper = ({ callback, children }) => {
    const innerRef = useRef();
    const resizeObserver = useRef();
    const abortResizeCallbackRef = useRef();

    const onResize = useMemo(() => intervalWrapper(() => {
        if (innerRef.current) abortResizeCallbackRef.current = callback(innerRef.current);
    }, 200, false), [callback]);

    // Run `callback` when it's changed and initialize a ResizeObserver object (if it's supported), which will trigger onResize function
    // `useLayoutEffect` is used instead of `useEffect` in order to run callback synchronously
    useLayoutEffect(() => {
        console.log("IN <OnResizeWrapper> useLayoutEffect")
        onResize();
        if (window.ResizeObserver) {
            resizeObserver.current = new ResizeObserver(onResize);
            resizeObserver.current.observe(innerRef.current);
        }
        return () => { 
            console.log("IN <OnResizeWrapper>, useLayoutEffect CANCEL")
            // Clear ResizeObserver
            if (resizeObserver.current) resizeObserver.current.disconnect(); 

            // Abort any scheduled callback runs
            if (abortResizeCallbackRef.current) abortResizeCallbackRef.current();
        };
    }, [callback]);
    
    return (
        <Ref innerRef={innerRef}>
            {children}
        </Ref>
    );
};