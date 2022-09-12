import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Header, Icon } from "semantic-ui-react";

import intervalWrapper from "../../util/interval-wrapper";

import StyleFieldItemList from "../../styles/field-item-list.css";


/**
 * Field item list component with customizable item IDs and item components. Optionally provides expand/collapse functionality.
 */
export const FieldItemList = ({ header, ItemComponent, itemIDsSelector, isExpandable }) => {
    const itemIDs = useSelector(itemIDsSelector);
    const items = itemIDs.map(id => <ItemComponent key={id} id={id} />);

    const [isExpanded, setIsExpanded] = useState(false);
    const [isExpandRequired, setIsExpandRequired] = useState(false);

    // Header
    const _header = useMemo(() => 
        header && <Header as="h5" className="field-item-list-header">{header}</Header>
    , [header]);

    // Expand/collapse block
    let itemListClassName = "field-item-list";
    if (isExpandable && !isExpanded) itemListClassName += " collapsed";
    if (!header) itemListClassName += " no-header";
    // const itemListClassName = !isExpandable || isExpanded ? "field-item-list" : "field-item-list-collapsed";
    const expandDiv = useMemo(() => 
        isExpandable && isExpandRequired && items.length > 0 && (
        <div className="field-item-list-expand-div" onClick={() => setIsExpanded(!isExpanded)}>
            <Icon name={isExpanded ? "angle up" : "angle down"} />
            {isExpanded ? "Collapse" : "Expand"}
        </div>
    ), [isExpandable, isExpandRequired, items.length > 0, isExpanded]);

    // isExpandRequired updates
    const itemListRef = useRef();
    const onResize = useRef(intervalWrapper(() => {
        if (itemListRef.current) {
            const itemListLineHeight = parseInt(getComputedStyle(itemListRef.current).lineHeight.replace("px", ""));      // line-height CSS property
            const itemListScrollHeight = itemListRef.current.scrollHeight;            // total height of the ItemList div
            const newIsExpandRequired = itemListScrollHeight >= 2 * itemListLineHeight;
            setIsExpandRequired(newIsExpandRequired);
        }
    }, 200, false)).current;
    
    // Add/remove window on resize event listener and run onResize handler when itemIDs are modified 
    // (also, add/remove logic doesn't work when effect is executed once (return function is executed immediately, for some reason))
    useEffect(() => {
        if (isExpandable) {
            onResize();
            window.addEventListener("resize", onResize);
            return () => { window.removeEventListener("resize", onResize); }
        }
    }, [itemIDs]);

    return items.length > 0 && (
        <div className="field-item-list-wrapper">
            {_header}
            <div className={itemListClassName} ref={itemListRef}>
                {items}
            </div>
            {expandDiv}
        </div>
    );
};


/**
 * A single field item with provided.
 * Displays provided `text` as a link, if `URL` is provided.
 * If `onChange` prop is provided, also displays a checkbox and uses and it as a change callback.
 * If checkbox is rendered, `isChecked` should be provided as well.
 */
 export const FieldItem = ({ text, URL, onChange, isChecked }) => {
    const input = onChange && <input type="checkbox" className="field-item-checkbox" checked={isChecked} onChange={onChange} />;
    let _text = <span className="field-item-text">{text}</span>;
    if (URL) _text = <Link className="field-item-link" to={URL}>{_text}</Link>;
    
    return (
        <div className="field-item">
            {input}
            {_text}
        </div>
    );
};
