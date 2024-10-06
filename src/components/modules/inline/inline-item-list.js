import React from "react";


/**
 * Shorthand for creating inline item lists.
 * Creates an <ItemComponent> for each id in `itemIDs`.
 */
export const InlineItemList = ({ itemIDs, ItemComponent }) => {
    if (itemIDs.length === 0) return null;

    const items = itemIDs.map(id => <ItemComponent key={typeof(id) === "number" ? id : "_"+id} id={id}/>);
    return (
        <>
            {items}
        </>
    );
};
