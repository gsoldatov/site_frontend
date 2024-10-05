import React, { useState, useMemo, memo } from "react";
import { Icon } from "semantic-ui-react";

import { OnResizeWrapper } from "./wrappers/on-resize-wrapper";
import { anyChildIsRendered } from "../../util/components";

import StyleExpandableContainer from "../../styles/modules/expandable-container.css";


/**
 * Wraps `children` in an expandable container with an expand/collapse toggle 
 * and maximum height in collapsed state set to `maxCollapsedHeight`.
 */
export const ExpandableContainer = memo(({ children, maxCollapsedHeight }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isToggleVisible, setIsToggleVisible] = useState(false);

    const onResizeCallback = useMemo(() => containerRef => {
        const height = parseInt(getComputedStyle(containerRef).height.replace("px", ""));
        setIsToggleVisible(height > maxCollapsedHeight);
    }, [maxCollapsedHeight]);

    const toggleOnClick = useMemo(() => () => setIsExpanded(!isExpanded), [isExpanded]);

    // styles
    const containerClassName = "expandable-container" + (isToggleVisible ? " with-toggle": "");
    const contentStyle = useMemo(() => (isExpanded ? undefined : { maxHeight: maxCollapsedHeight }), [maxCollapsedHeight, isExpanded]);

    // Don't render anything, if children are not rendered
    if (!anyChildIsRendered(children)) return null;

    const toggle = isToggleVisible && (
        <div className="expandable-container-toggle" onClick={toggleOnClick}>
            <Icon name={isExpanded ? "angle up" : "angle down"} />
            {isExpanded ? "Collapse" : "Expand"}
        </div>
    );

    return (
        <div className={containerClassName}>
            <div className="expandable-container-content" style={contentStyle}>
                <OnResizeWrapper callback={onResizeCallback}>
                    {children}
                </OnResizeWrapper>
            </div>
            {toggle}
        </div>
    );
});
