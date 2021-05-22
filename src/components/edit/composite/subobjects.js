import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { SubobjectCard } from "./subobject-card/card";
import { AddSubobjectMenu } from "./add-subobject-menu";

import { setEditedObject } from "../../../actions/object";
import { getSubobjectDisplayOrder } from "../../../store/state-util/composite";

import StyleSubobjects from "../../../styles/subobjects.css";


/*
    Composite object grid with subobjects' cards
*/
export const SubobjectsContainer = ({ objectID }) => {
    const dispatch = useDispatch();
    const updateCallback = useMemo(
        () => params => dispatch(setEditedObject(params, objectID))
    , []);

    const composite = useSelector(state => state.editedObjects[objectID].composite);
    const subobjectOrder = getSubobjectDisplayOrder(composite);
    
    let subobjectGrid = [];

    for (let i = 0; i < subobjectOrder.length; i++) {
        let columnItems = [];

        for (let subobjectID of subobjectOrder[i]) {
            let selectedTab = composite.subobjects[subobjectID].selectedTab;
            columnItems.push(<SubobjectCard key={subobjectID} objectID={objectID} subobjectID={subobjectID} updateCallback={updateCallback}
                selectedTab={selectedTab} />);
        }
        
        columnItems.push(<AddSubobjectMenu key="addMenu" row={subobjectOrder[i].length} column={i} updateCallback={updateCallback} />);

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