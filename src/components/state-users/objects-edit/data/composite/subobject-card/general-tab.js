import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ObjectTypeSelector } from "../../../attributes/object-type-selector";
import { Timestamps, NameInput, DescriptionEditor } from "../../../../../modules/edit/attributes";

import { setEditedObject } from "../../../../../../actions/objects-edit";


/**
 * Subobject card "General" tab content. 
 */
export const CardGeneralTab = ({ subobjectID }) => {
    const dispatch = useDispatch();

    // Timestamps' props
    const createdAt = useSelector(state => state.editedObjects[subobjectID].created_at);
    const modifiedAt = useSelector(state => state.editedObjects[subobjectID].modified_at);
    const areTimestampsDisplayed = useSelector(state => subobjectID > 0);

    // Name & description props
    const name = useSelector(state => state.editedObjects[subobjectID].object_name);
    const description = useSelector(state => state.editedObjects[subobjectID].object_description);

    const nameOnChange = useRef(object_name => {
        dispatch(setEditedObject({ object_name }, subobjectID));
    }).current;

    const descriptionOnChange = useRef(object_description => {
        dispatch(setEditedObject({ object_description }, subobjectID));
    }).current;

    const timestamps = areTimestampsDisplayed && <Timestamps createdAt={createdAt} modifiedAt={modifiedAt} />;

    return (
        <div className="composite-subobject-card-tab">
            <ObjectTypeSelector objectID={subobjectID} isSubobject />
            {timestamps}
            <NameInput label="Object Name" placeholder="Object name" value={name} onChange={nameOnChange} />
            <DescriptionEditor label="Object Description" placeholder="Object description" value={description} onChange={descriptionOnChange} />
        </div>
    );
};
