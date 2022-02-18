import React from "react";
import { useSelector } from "react-redux";

import { ObjectTimeStamp } from "./object-timestamp";
import { ObjectDescription } from "./object-description";
import { ObjectHeader } from "./object-header";
import { ObjectIsEdited } from "./object-is-edited-warning";


/**
 * Container for object/subobject attributes.
 */
export const ObjectAttributes = ({ objectID, subobjectID, isSubobject = false, disableCompositeDisplayModeCheck = false, displayTimestamp = true }) => {
    // Check if attributes should be rendered
    const _id = isSubobject ? subobjectID : objectID;
    const canRender = useSelector(state => 
        // Object data is present in state (can be false after logout)
        state.objects[_id] !== undefined

        // Rendering for root composite object with `chapters` display mode
        && (disableCompositeDisplayModeCheck 
            || isSubobject
            || state.objects[_id].object_type !== "composite" 
            || (state.composite[_id] || {}).display_mode !== "chapters"
        )
    );

    const timeStamp = !isSubobject && displayTimestamp && <ObjectTimeStamp objectID={_id} />;

    return canRender && (
        <div className="objects-view-attributes">
            {timeStamp}
            <ObjectHeader objectID={objectID} subobjectID={subobjectID} isSubobject={isSubobject} />
            <ObjectIsEdited objectID={objectID} subobjectID={subobjectID} isSubobject={isSubobject} />
            <ObjectDescription objectID={objectID} subobjectID={subobjectID} isSubobject={isSubobject} />
        </div>
    );
};
