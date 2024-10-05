import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "semantic-ui-react";

import StyleFieldItemList from "../../styles/modules/field-item-list.css";


/**
 * Field item list component.
 * Can display optional `header` text and use custom <ItemComponent> to display its items.
 */
export const FieldItemList = ({ header, itemIDs, ItemComponent }) => {
    const items = itemIDs.map(id => <ItemComponent key={id} id={id} />);

    // Header
    const _header = useMemo(() => 
        header && itemIDs.length > 0 && <Header as="h5" className="field-item-list-header">{header}</Header>
    , [header, itemIDs.length > 0]);

    // Don't render without children
    if (items.length === 0) return null;

    let itemListClassName = "field-item-list";
    if (!header) itemListClassName += " no-header";

    return (
        <div className="field-item-list-wrapper">
            {_header}
            <div className={itemListClassName}>
                {items}
            </div>
        </div>
    );
};


/**
 * A single field item with provided.
 * Displays provided `text` as a link, if `URL` is provided.
 * If `onChange` prop is provided, also displays a checkbox and uses and it as a change callback.
 * If checkbox is rendered, `isChecked` should be provided as well.
 * 
 * NOTE: component users should provide memoization.
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
