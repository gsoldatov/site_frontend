import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlCheckbox } from "../display-controls/display-control-checkbox";

import { setEditedObject } from "../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-objects-edit";


/**
 * Component for switching `is_published` setting of the object or composite subobject.
 */
 export const IsPublishedSwitch = ({ objectID, isSubobject = false }) => {
    const dispatch = useDispatch();
    const isPublished = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).is_published);
    const objectType = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).object_type);
    const onClick = useMemo(() => () => dispatch(setEditedObject({ is_published: !isPublished }, objectID)), [objectID, isPublished]);

    // Don't display if subobject is composite
    return !(isSubobject && objectType === "composite") && (
        <DisplayControlCheckbox checked={isPublished} onClick={onClick} label="Publish Object" />
    );
};


/**
 * Component for switching `is_published` setting of a component object's subobjects.
 */
 export const SubobjectsIsPublishedSwitch = ({ objectID, isSubobject = false }) => {
    const dispatch = useDispatch();
    
    const subobjectsIsPublishedState = useSelector(state => {
        const editedObject = getEditedOrDefaultObjectSelector(objectID)(state);
        let numberOfSubobjects = 0, numberOfPublishedSubobjects = 0;

        Object.keys(editedObject.composite.subobjects).forEach(subobjectID => {
            if (subobjectID in state.editedObjects) {
                numberOfSubobjects++;
                if (state.editedObjects[subobjectID].is_published) numberOfPublishedSubobjects++;
            }
        });
        return numberOfSubobjects === numberOfPublishedSubobjects ? "yes"
            : numberOfPublishedSubobjects > 0 ? "partially" : "no";
    });

    const onClick = useMemo(() => () =>
        dispatch(setEditedObject({ compositeUpdate: { command: "toggleSubobjectsIsPublished", subobjectsIsPublishedState }}, objectID))
    , [objectID, subobjectsIsPublishedState]);

    const objectTypeSelector = useMemo(() => state => getEditedOrDefaultObjectSelector(objectID)(state).object_type, [objectID]);
    const objectType = useSelector(objectTypeSelector);

    // Don't display if subobject or non composite
    return !isSubobject && objectType === "composite" && (
        <DisplayControlCheckbox checked={subobjectsIsPublishedState === "yes"} 
            indeterminate={subobjectsIsPublishedState === "partially"} onClick={onClick} label="Publish Subobjects" />
    );
};
