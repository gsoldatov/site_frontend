import React from "react";
import { useSelector } from "react-redux";


/**
 * Inline item list component.
 */
export const InlineItemList = ({ itemIDSelector, itemIDs, ItemComponent }) => {
    let _itemIDSelector = itemIDSelector || (() => []);

    let _itemIDs = useSelector(_itemIDSelector);
    if (itemIDs) _itemIDs = itemIDs;
    
    if (_itemIDs.length === 0) return null;

    const items = _itemIDs.map(id => <ItemComponent key={typeof(id) === "number" ? id : "_"+id} id={id}/>);
    return (
        <>
            {items}
        </>
    );
};
