import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DraggableSubobjectCard } from "./subobject-card/subobject-card";
import { DroppableAddSubobjectMenu } from "./add-subobject-menu";
import { NewSubobjectGridColumn } from "./new-subobject-grid-column";

import { setEditedObject, setAddCompositeSubobjectMenu } from "../../../../../actions/objects-edit";
import { CompositeSelectors } from "../../../../../store/selectors/data/objects/composite";
import { SubobjectDeleteModes } from "../../../../../store/types/data/composite";

import StyleCompositeSubobjects from "../../../../../styles/modules/edit/composite-subobjects.css";


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
    const subobjectOrder = CompositeSelectors.getSubobjectDisplayOrder(composite);
    
    const canDrag = useSelector(CompositeSelectors.isCompositeDragAndDropEnabledSelector);
    const existingObjectInputRow = useSelector(state => state.objectsEditUI.addCompositeSubobjectMenu.row);
    const existingObjectInputColumn = useSelector(state => state.objectsEditUI.addCompositeSubobjectMenu.column);
    
    let subobjectGrid = [];

    // Subobject grid
    for (let i = 0; i < subobjectOrder.length; i++) {
        let columnItems = [];

        for (let j = 0; j < subobjectOrder[i].length; j++) {
            const subobjectID = subobjectOrder[i][j];
            let fetchError = composite.subobjects[subobjectID].fetchError;
            let selectedTab = composite.subobjects[subobjectID].selected_tab;
            let isExpanded = composite.subobjects[subobjectID].is_expanded;
            let isSubobjectEdited = editedObjects[subobjectID] !== undefined;
            let isSubobjectDeleted = composite.subobjects[subobjectID].deleteMode !== SubobjectDeleteModes.none;

            columnItems.push(<DraggableSubobjectCard key={subobjectID} objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback}
                selectedTab={selectedTab} isExpanded={isExpanded} isSubobjectEdited={isSubobjectEdited} fetchError={fetchError} isSubobjectDeleted={isSubobjectDeleted} 
                canDrag={canDrag} />);
        }
        
        // <DroppableAddSubobjectMenu> at the bottom of the column
        const isObjectInputDisplayed = existingObjectInputRow === subobjectOrder[i].length && existingObjectInputColumn === i;
        
        columnItems.push(<DroppableAddSubobjectMenu key="addMenu" row={subobjectOrder[i].length} column={i} objectID={objectID} updateCallback={updateCallback} setAddMenuCallback={setAddMenuCallback}
            isObjectInputDisplayed={isObjectInputDisplayed} />);
        
        // Add column
        const displayRightNewColumn = i === subobjectOrder.length - 1;
        subobjectGrid.push(
            <SubobjectGridColumn key={i} column={i} items={columnItems} displayRightNewColumn={displayRightNewColumn} />
        );
    }

    const subobjectGridClassName = "composite-subobject-grid" + (subobjectOrder.length > 1 ? " multicolumn" : "");
    
    return (
        <div className={subobjectGridClassName}>
            {subobjectGrid}
        </div>
    );
};


/**
 * Subobject grid column component with new column dropzones to the left and right.
 */
const SubobjectGridColumn = ({ column, items, displayRightNewColumn }) => {
    // Column container classname
    const columnContainerClassName = "composite-subobject-grid-column-container" + (displayRightNewColumn ? " two-dropzones" : "");

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
            <div className="composite-subobject-grid-column">
                {items}
            </div>
            {newColumnDropzoneRight}
        </div>
    );
};