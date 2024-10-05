import React, { createContext, useEffect, useMemo, useState } from "react";
import { getThresholdForValue } from "../../../util/size-context-wrappers";


const windowWidthThresholds = [767];    // must be sorted; 768px is a commonly used @media threshold in SUIR
export const WindowWidthContext = createContext(windowWidthThresholds.length);


/**
 * Monitors, if `window.innerWidth` exceeds specified `windowWidthThresholds` 
 * and provides via context the first threshold number, which is not exceeded `window.innerWidth`.
 */
export const WindowWidthProvider = ({ children }) => {
    const [currentThreshold, setCurrentThreshold] = useState(windowWidthThresholds.length);

    const onResize = useMemo(() => () => {
        const newCurrentThreshold = getThresholdForValue(window.innerWidth, windowWidthThresholds);
        setCurrentThreshold(newCurrentThreshold);
    }, []);

    useEffect(() => {
        // Update context on render
        onResize();

        // Handle resize event listening
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <WindowWidthContext.Provider value={currentThreshold}>
            {children}
        </WindowWidthContext.Provider>
    );
};
