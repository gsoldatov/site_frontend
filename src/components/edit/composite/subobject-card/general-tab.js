import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ObjectTypeSelector } from "../../../edit/object";
import { TimeStamps, NameDescriptionInput } from "../../../edit/common";

import { setEditedObject } from "../../../../actions/object";

/*
    Subobject card "General" tab content.
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
            <ObjectTypeSelector objectID={subobjectID} />
            <TimeStamps createdAtSelector={createdAtSelector} modifiedAtSelector={modifiedAtSelector} isDisplayedSelector={isDisplayedSelector} />
            <NameDescriptionInput nameLabel="Object Name" namePlaceholder="Object name" name={name} nameOnChange={nameOnChange}
                descriptionLabel="Object Description" descriptionPlaceholder="Object description" description={description} descriptionOnChange={descriptionOnChange} />
        </div>
    );
};
