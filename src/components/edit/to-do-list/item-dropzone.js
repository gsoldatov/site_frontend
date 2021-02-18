import React from "react";


/*
    A dropzone and additional space which is rendered in a to-do item when its is dragged over by another item.
*/
export const ItemDropzone = ({ currentIndent, maxIndent, indentUpdateCallback }) => {
    // Dropzones which update the new indent of the dropped item
    const dropZones = [0, 1, 2, 3, 4, 5].map(indent => {
        const className = "to-do-list-item-drop-zone"
                        .concat(indent === 0 ? " first" : "")
                        .concat(indent === 5 ? " last" : "");
        const onDragEnter = e => { 
            indentUpdateCallback(Math.min(indent, maxIndent !== undefined ? maxIndent : 6));
        };
        return <div key={indent} className={className} onDragEnter={onDragEnter} />;
    });
    
    // Visual indicators of new indent
    const indentIndicators = [0, 1, 2, 3, 4, 5].map(indent => {
        const className = "to-do-list-item-indent-indicator"
                        .concat(indent === 0 ? " first" : "")
                        .concat(indent === 5 ? " last" : "")
                        .concat(indent >= currentIndent ? " active" : "");
        return <div key={indent} className={className} />;
    });

    return (
        <>
            <div className="to-do-list-item-drop-zone-container">{dropZones}</div>
            <div className="to-do-list-item-indent-indicator-container">{indentIndicators}</div>
        </>
    );
};
