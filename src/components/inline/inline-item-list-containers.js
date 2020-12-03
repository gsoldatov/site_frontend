import React from "react";
import StyleInline from "../../styles/inline.css";


/*
    Container components for inline item lists.
*/
//  Highest level component for inline itemlists. Contains one or more <InlineItemListWrapper> components.
export const InlineItemListBlock = ({header, children}) => {
    const _header = header && <div className="inline-item-list-block-header">{header}</div>;

    return (
        <div className="inline-item-list-block">
            {_header}
            {children}
        </div>
    );
};

// Component for groupping inline item lists and input controls.
export const InlineItemListWrapper = ({header, children}) => {
    const _header = header && <div className="inline-item-list-wrapper-header">{header}</div>;

    return (
        <div className="inline-item-list-wrapper">
            {_header}
            {children}
        </div>
    );
};
    