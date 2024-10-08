import React, { forwardRef, memo } from "react";


/**
 * Subobject card area, which collapses it on click.
 */
export const CardCollapseArea = memo(forwardRef(({ updateCallback, subobjectID }, headingRef) => {
    const onClick = () => {     // NOTE: not memoized, because it depends on each prop of the component
        updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, is_expanded: false }});
        if (headingRef.current) headingRef.current.scrollIntoView(true);
    };
    
    return (
        <div className="composite-subobject-card-collapse-area" onClick={onClick}>
            Collapse
        </div>
    );
}));
