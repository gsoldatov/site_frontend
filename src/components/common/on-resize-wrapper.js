import React, { useRef, useEffect } from "react";

import { Ref } from "semantic-ui-react";

import intervalWrapper from "../../util/interval-wrapper";


/*
    Wrapper component, which checks if width of its child is greater than `threshold` and runs `callback` function with `threshold` as an argument when
*/
export const OnResizeWrapper = ({ threshold, callback, children }) => {
    const innerRef = useRef();
    const resizeObserver = useRef();

    const onResize = useRef(intervalWrapper(() => {
        if (innerRef.current) {
            const childWidth = parseInt(getComputedStyle(innerRef.current).width.replace("px", ""));
            callback(childWidth > threshold);
        }
    }, 200, false)).current;

    // Run onResize after first render and initialize a ResizeObserver object, which will trigger onResize function
    useEffect(() => {
        onResize();
        resizeObserver.current = new ResizeObserver(onResize);
        resizeObserver.current.observe(innerRef.current);
        return () => { resizeObserver.current.disconnect(); };

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