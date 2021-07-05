import React, { useMemo } from "react";
import { useDrop } from "react-dnd";

import { SubobjectCardDropZone } from "./subobject-card/card-dropzone";


/**
 * New composite subobject grid column placeholder displayed during drag and drop of subobjects.
 */
export const NewSubobjectGridColumn = ({ column }) => {
    const [collectedProps, dropRef] = useDrop({
        accept: ["composite subobject"],
        drop: item => ({ objectID: item.objectID, newColumn: column, newRow: 0 }),
        canDrop: (item, monitor) => item.objectID === monitor.getItem().objectID,
        collect: (monitor) => ({
            isDraggedOver: monitor.canDrop() && monitor.isOver()
        })
    });
    const { isDraggedOver } = collectedProps;

    // Dropzone
    const dropzone = isDraggedOver && <SubobjectCardDropZone />;


    let cssClassName = "composite-subobject-grid-column new";
    if (isDraggedOver) cssClassName += " is-dragged-over";

    return (
        <div ref={dropRef} className={cssClassName}>
            {dropzone}
        </div>
    );
};