import React, { useMemo } from "react";
import { Checkbox } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { setEditedObject } from "../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-objects-edit";


/**
 * Component for switching `is_published` setting of the object or composite subobject.
 */
 export const IsPublishedSwitch = ({ objectID }) => {
    const dispatch = useDispatch();
    const isPublished = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).is_published);
    const onClick = useMemo(() => () => dispatch(setEditedObject({ is_published: !isPublished }, objectID)), [objectID, isPublished]);

    return (
        <div className="objects-edit-display-control-container">
            <Checkbox className="objects-edit-display-checkbox-container" checked={isPublished} onClick={onClick} label="Publish Object" />
        </div>
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

    if (isSubobject || objectType !== "composite") return null;

    return (
        <div className="objects-edit-display-control-container">
            <Checkbox className="objects-edit-display-checkbox-container" checked={subobjectsIsPublishedState === "yes"} 
                indeterminate={subobjectsIsPublishedState === "partially"} onClick={onClick} label="Publish Subobjects" />
        </div>
    );
};
