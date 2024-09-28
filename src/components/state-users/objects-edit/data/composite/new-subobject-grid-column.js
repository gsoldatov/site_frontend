import React, { memo } from "react";
import { useDrop } from "react-dnd";


/**
 * New composite subobject grid column placeholder displayed during drag and drop of subobjects.
 */
export const NewSubobjectGridColumn = memo(({ column, isDroppedToTheLeft, isDroppedToTheRight }) => {
    const [collectedProps, dropRef] = useDrop({
        accept: ["composite subobject"],
        drop: item => ({ objectID: item.objectID, newColumn: column, newRow: 0, isDroppedToTheLeft, isDroppedToTheRight }),
        canDrop: (item, monitor) => item.objectID === monitor.getItem().objectID,
        collect: (monitor) => ({
            isDraggedOver: monitor.canDrop() && monitor.isOver()
        })
    });
    const { isDraggedOver } = collectedProps;

    let cssClassName = "composite-subobject-grid-new-column-dropzone";
    if (isDraggedOver) cssClassName += " is-dragged-over";

    return (
        <div ref={dropRef} className={cssClassName} />
    );
});
