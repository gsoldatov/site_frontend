import React from "react";
import { useSelector } from "react-redux";
import StyleInline from "../../styles/inline.css";


/**
 * Container components for inline item lists.
 * 
 * Highest level component for inline itemlists. Contains one or more <InlineItemListWrapper> components.
 */
export const InlineItemListBlock = ({ header, children, borderless = false }) => {
    const _header = header && <div className="inline-item-list-block-header">{header}</div>;
    const className = "inline-item-list-block" + (borderless ? " borderless" : "");

    return (
        <>
            {_header}
            <div className={className}>
                {children}
            </div>
        </>
    );
};

/**
 * Component for groupping inline item lists and input controls.
 */
export const InlineItemListWrapper = ({header, children, isDisplayedSelector}) => {
    const isDisplayed = isDisplayedSelector ? useSelector(isDisplayedSelector) : true;
    if (!isDisplayed) return null;

    const _header = header && <div className="inline-item-list-wrapper-header">{header}</div>;

    return (
        <>
            {_header}
            <div className="inline-item-list-wrapper">
                {children}
            </div>
        </>
    );
};
    