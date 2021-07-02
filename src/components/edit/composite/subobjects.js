import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DraggableSubobjectCard } from "./subobject-card/subobject-card";
import { AddSubobjectMenu } from "./add-subobject-menu";

import { setEditedObject, setAddCompositeSubobjectMenu } from "../../../actions/object";
import { getSubobjectDisplayOrder, isCompositeDragAndDropEnabledSelector } from "../../../store/state-util/composite";
import { enumDeleteModes } from "../../../store/state-templates/composite-subobjects";

import StyleSubobjects from "../../../styles/subobjects.css";


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

    const canDrag = useSelector(isCompositeDragAndDropEnabledSelector);

    const editedObjects = useSelector(state => state.editedObjects);
    const composite = useSelector(state => state.editedObjects[objectID].composite);
    const subobjectOrder = getSubobjectDisplayOrder(composite);
    const existingObjectInputRow = useSelector(state => state.objectUI.addCompositeSubobjectMenu.row);
    const existingObjectInputColumn = useSelector(state => state.objectUI.addCompositeSubobjectMenu.column);
    
    let subobjectGrid = [];

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
        
        // <AddSubobjectMenu> at the bottom of the column
        const isObjectInputDisplayed = existingObjectInputRow === subobjectOrder[i].length && existingObjectInputColumn === i;
        
        columnItems.push(<AddSubobjectMenu key="addMenu" row={subobjectOrder[i].length} column={i} objectID={objectID} updateCallback={updateCallback} setAddMenuCallback={setAddMenuCallback}
            isObjectInputDisplayed={isObjectInputDisplayed} />);

        subobjectGrid.push(
            <div className="composite-subobject-grid-column" key={i}>
                {columnItems}
            </div>
        );
    }
    
    return (
        <div className="composite-subobject-grid">
            {subobjectGrid}
        </div>
    );
};