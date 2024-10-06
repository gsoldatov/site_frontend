import React from "react";

import StyleInline from "../../../styles/modules/inline.css";


/**
 * Container components for inline item lists.
 * 
 * Highest level component for inline itemlists. Contains one or more <InlineItemListWrapper> components.
 */
export const InlineItemListBlock = ({ header, children, className }) => {
    const headerClassName = "inline-item-list-block-header" + (className ? ` ${className}` : "");
    const contentclassName = "inline-item-list-block-content" + (className ? ` ${className}` : "");

    const _header = header && <div className={headerClassName}>{header}</div>;

    return (
        <div className="inline-item-list-block">
            {_header}
            <div className={contentclassName}>
                {children}
            </div>
        </div>
    );
};


/**
 * Component for groupping inline item lists and input controls.
 */
export const InlineItemListWrapper = ({ header, children }) => {
    const _header = header && <div className="inline-item-list-wrapper-header">{header}</div>;

    return (
        <div className="inline-item-list-wrapper">
            {_header}
            <div className="inline-item-list-wrapper-content">
                {children}
            </div>
        </div>
    );
};
    