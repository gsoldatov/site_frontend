import React, { useRef, useLayoutEffect, useMemo } from "react";

import { Ref } from "semantic-ui-react";

import { debounce } from "../../../util/debounce";


/**
 * Subscribes to resize events of the DOM element rendered by a child component.
 * Fires debounced `callback` function and provides reference to the DOM element to it.
 * 
 * NOTE: component supports only a single child component, which renders a DOM element.
 */
export const OnResizeWrapper = ({ callback, children, delay = 80 }) => {
    const innerRef = useRef();
    const resizeObserver = useRef();
    // const abortResizeCallbackRef = useRef();

    const onResize = useMemo(() => debounce(() => {
        // Running callbacks, which change the state of a component in <ResizeObserver> can trigger additional resize events during a single node repaint,
        // and lead to potential endless loops, (and, as such, is considered an error & displayed by Webpack Dev Server when using Typescript).
        // As a workaround to avoid the error, state update is run after a short timeout, so that DOM repaint of the component elements happens first.
        // https://stackoverflow.com/questions/76187282/react-resizeobserver-loop-completed-with-undelivered-notifications
        setTimeout(() => { 
            if (innerRef.current)callback(innerRef.current);
        }, 20);

        // if (innerRef.current) abortResizeCallbackRef.current = callback(innerRef.current);   // NOTE: this is not a debounced function call & won't return abort fn?
    }, delay, "noRefresh"), [callback]);

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

            // // Abort any scheduled callback runs
            // if (abortResizeCallbackRef.current) abortResizeCallbackRef.current();
        };
    }, [callback]);
    
    return (
        <Ref innerRef={innerRef}>
            {children}
        </Ref>
    );
};
