import React, { useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DraggableSubobjectCard } from "./subobject-card/subobject-card";
import { DroppableAddSubobjectMenu } from "./add-subobject-menu";
import { NewSubobjectGridColumn } from "./new-subobject-grid-column";

import { setEditedObject, setAddCompositeSubobjectMenu } from "../../../actions/object";
import { getSubobjectDisplayOrder, isCompositeDragAndDropEnabledSelector } from "../../../store/state-util/composite";
import { enumDeleteModes } from "../../../store/state-templates/composite-subobjects";

import StyleSubobjects from "../../../styles/subobjects.css";
import { useDrop } from "react-dnd";
import { useEffect } from "react";


/**
 * Composite object grid with subobjects' cards.
 */
export const SubobjectsContainer = ({ objectID }) => {
    const dispatch = useDispatch();
    const updateCallback = useMemo(
        () => params => dispatch(setEditedObject(params, objectID))
    , [objectID]);
    const setAddMenuCallback = useMemo(
        () => addCompositeSubobjectMenu => dispatch(setAddCompositeSubobjectMenu(addCompositeSubobjectMenu))
    , []);


    const editedObjects = useSelector(state => state.editedObjects);
    const composite = useSelector(state => state.editedObjects[objectID].composite);
    const subobjectOrder = getSubobjectDisplayOrder(composite);
    
    const canDrag = useSelector(isCompositeDragAndDropEnabledSelector);
    const existingObjectInputRow = useSelector(state => state.objectUI.addCompositeSubobjectMenu.row);
    const existingObjectInputColumn = useSelector(state => state.objectUI.addCompositeSubobjectMenu.column);
    
    let subobjectGrid = [];
    
    // Set max width of the column without dropzones (75% screen / numOfColumns, but >= 300px); 300px = card min width, 75% screen = default main area width
    const columnStyle = { maxWidth: `max(300px, calc(75vw / ${subobjectOrder.length}))`};

    // Subobject grid
    for (let i = 0; i < subobjectOrder.length; i++) {
        let columnItems = [];

        for (let j = 0; j < subobjectOrder[i].length; j++) {
            const subobjectID = subobjectOrder[i][j];
            let fetchError = composite.subobjects[subobjectID].fetchError;
            let selectedTab = composite.subobjects[subobjectID].selected_tab;
            let isExpanded = composite.subobjects[subobjectID].is_expanded;
            let isSubbjectEdited = editedObjects[subobjectID] !== undefined;
            let isSubobjectDeleted = composite.subobjects[subobjectID].deleteMode !== enumDeleteModes.none;

            columnItems.push(<DraggableSubobjectCard key={subobjectID} objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback}
                selectedTab={selectedTab} isExpanded={isExpanded} isSubbjectEdited={isSubbjectEdited} fetchError={fetchError} isSubobjectDeleted={isSubobjectDeleted} 
                canDrag={canDrag} />);
        }
        
        // <DroppableAddSubobjectMenu> at the bottom of the column
        const isObjectInputDisplayed = existingObjectInputRow === subobjectOrder[i].length && existingObjectInputColumn === i;
        
        columnItems.push(<DroppableAddSubobjectMenu key="addMenu" row={subobjectOrder[i].length} column={i} objectID={objectID} updateCallback={updateCallback} setAddMenuCallback={setAddMenuCallback}
            isObjectInputDisplayed={isObjectInputDisplayed} />);
        
        // Add column
        const displayRightNewColumn = i === subobjectOrder.length - 1;
        subobjectGrid.push(
            <SubobjectGridColumn key={i} column={i} items={columnItems} displayRightNewColumn={displayRightNewColumn} columnStyle={columnStyle} />
        );
    }
    
    return (
        <div className="composite-subobject-grid">
            {subobjectGrid}
        </div>
    );
};


/**
 * Subobject grid column component with new column dropzones to the left and right.
 */
const SubobjectGridColumn = ({ column, items, displayRightNewColumn, columnStyle }) => {
    // Column container classname
    let columnContainerClassName = "composite-subobject-grid-column-container";
    if (displayRightNewColumn) columnContainerClassName += " two-dropzones";

    // New column dropzones to the left & right
    const newColumnDropzoneLeft = (
        <NewSubobjectGridColumn column={column} isDroppedToTheLeft />
    );

    const newColumnDropzoneRight = displayRightNewColumn && (
        <NewSubobjectGridColumn column={column} isDroppedToTheRight />
    );

    return (
        <div className={columnContainerClassName}>
            {newColumnDropzoneLeft}
            <div className="composite-subobject-grid-column" style={columnStyle}>
                {items}
            </div>
            {newColumnDropzoneRight}
        </div>
    );
}
