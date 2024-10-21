import React, { useRef, useLayoutEffect, useMemo } from "react";

import { Ref } from "semantic-ui-react";

import debounce from "../../../util/debounce";
import { enumDebounceDelayRefreshMode } from "../../../util/enums/enum-debounce-delay-refresh-mode";


/**
 * Subscribes to resize events of the DOM element rendered by a child component.
 * Fires debounced `callback` function and provides reference to the DOM element to it.
 * 
 * NOTE: component supports only a single child component, which renders a DOM element.
 */
export const OnResizeWrapper = ({ callback, children, delay = 100 }) => {
    const innerRef = useRef();
    const resizeObserver = useRef();
    const abortResizeCallbackRef = useRef();

    const onResize = useMemo(() => debounce(() => {
        if (innerRef.current) abortResizeCallbackRef.current = callback(innerRef.current);
    }, delay, enumDebounceDelayRefreshMode.noRefresh), [callback]);

    // Handle subscription to resize events of the child element.
    // `useLayoutEffect` is used instead of `useEffect` in order to run callback synchronously.
    useLayoutEffect(() => {
        // Add a ResizeObserver for the child
        // (this also runs the `callback` before element is painted: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver#observation_errors)
        if (window.ResizeObserver) {
            resizeObserver.current = new ResizeObserver(onResize);
            resizeObserver.current.observe(innerRef.current);
        }
        return () => { 
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
