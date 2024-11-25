import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ObjectTypeSelector } from "../../../attributes/object-type-selector";
import { Timestamps, NameInput, DescriptionEditor } from "../../../../../modules/edit/attributes";

import { updateEditedObject } from "../../../../../../reducers/data/edited-objects";


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

    const nameOnChange = useMemo(() => object_name => {
        dispatch(updateEditedObject(subobjectID, { object_name }))
    }, [subobjectID]);

    const descriptionOnChange = useMemo(() => object_description => {
        dispatch(updateEditedObject(subobjectID, { object_description }))
    }, [subobjectID]);

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
