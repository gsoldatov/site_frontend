import React, { useRef, useEffect } from "react";

import { Ref } from "semantic-ui-react";

import intervalWrapper from "../../util/interval-wrapper";


/**
 * Wrapper component, which fires (with debouncing) provided `callback` when resize of its child occures and passes computed style into it.
 */
export const OnResizeWrapper = ({ callback, children }) => {
    const innerRef = useRef();
    const resizeObserver = useRef();
    
    const onResize = useRef(intervalWrapper(() => {
        if (innerRef.current) {
            callback(getComputedStyle(innerRef.current));
        }
    }, 200, false)).current;

    // Run onResize after first render and initialize a ResizeObserver object (if it's supported), which will trigger onResize function
    useEffect(() => {
        onResize();
        if (window.ResizeObserver) {
            resizeObserver.current = new ResizeObserver(onResize);
            resizeObserver.current.observe(innerRef.current);
        }
        return () => { 
            if (resizeObserver.current) 
                resizeObserver.current.disconnect(); 
        };

        // // Implementation with window event (does not trigger when the viewport size is not changed)
        // window.addEventListener("resize", onResize);
        // return () => {  window.removeEventListener("resize", onResize); }
    }, []);
    
    return (
        <Ref innerRef={innerRef}>
            {children}
        </Ref>
    );
};