import React from "react";

import StyleInline from "../../../styles/modules/inline.css";


/**
 * Container components for inline item lists.
 * 
 * Highest level component for inline itemlists. Contains one or more <InlineItemListWrapper> components.
 * 
 * `bordered` prop can be passed to add borders around content inside the container.
 */
export const InlineItemListBlock = ({ children, bordered }) => {
    let className = "inline-item-list-block";
    if (bordered) className += " bordered";

    return (
        <div className={className}>
            {children}
        </div>
    );
};


/**
 * Component for groupping inline item lists and input controls.
 * 
 * `bordered` prop can be passed to add borders around content inside the container.
 */
export const InlineItemListWrapper = ({ header, children, bordered }) => {
    let className = "inline-item-list-wrapper";
    if (bordered) className += " bordered";

    const _header = header && <div className="inline-item-list-wrapper-header">{header}</div>;

    return (
        <div className={className}>
            {_header}
            <div className="inline-item-list-wrapper-content">
                {children}
            </div>
        </div>
    );
};
