import React from "react";
import { useSelector } from "react-redux";


/*
    Inline item list component.
*/
export const InlineItemList = ({ itemIDSelector, ItemComponent }) => {
    // const stringItemKeyValue = useRef(-1);  // items with string ids use this key generator when generating a list on inline item components
    const itemIDs = useSelector(itemIDSelector);
    if (itemIDs.length === 0) return null;
    const items = itemIDs.map(id => <ItemComponent key={typeof(id) === "number" ? id : "_"+id} id={id}/>);
    return (
        <>
            {items}
        </>
        // <span className="inline-item-list">  // multiline span behaves like a box and takes the whole last line
        //     {items}
        // </span>
    );
};
