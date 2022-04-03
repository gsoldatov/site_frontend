import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ObjectTypeSelector } from "../../../edit/objects-edit";
import { TimeStamps, NameInput, DescriptionEditor } from "../../../edit/common/edit-page";

import { setEditedObject } from "../../../../actions/objects-edit";

/**
 * Subobject card "General" tab content. 
 */
export const CardGeneralTab = ({ subobjectID }) => {
    const dispatch = useDispatch();

    // Timestamps' props
    const createdAtSelector = useRef(state => state.editedObjects[subobjectID].created_at).current;
    const modifiedAtSelector = useRef(state => state.editedObjects[subobjectID].modified_at).current;
    const isDisplayedSelector = useRef(state => subobjectID > 0).current;

    // Name & description props
    const name = useSelector(state => state.editedObjects[subobjectID].object_name);
    const description = useSelector(state => state.editedObjects[subobjectID].object_description);

    const nameOnChange = useRef(object_name => {
        dispatch(setEditedObject({ object_name }, subobjectID));
    }).current;

    const descriptionOnChange = useRef(object_description => {
        dispatch(setEditedObject({ object_description }, subobjectID));
    }).current;

    return (
        <div className="composite-subobject-card-tab">
            <ObjectTypeSelector objectID={subobjectID} isSubobject />
            <TimeStamps createdAtSelector={createdAtSelector} modifiedAtSelector={modifiedAtSelector} isDisplayedSelector={isDisplayedSelector} />
            <NameInput label="Object Name" placeholder="Object name" value={name} onChange={nameOnChange} />
            <DescriptionEditor label="Object Description" placeholder="Object description" value={description} onChange={descriptionOnChange} />
        </div>
    );
};
