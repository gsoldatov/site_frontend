import React from "react";
import { useSelector } from "react-redux";

import { ObjectTimeStamp } from "./object-timestamp";
import { ObjectDescription } from "./object-description";
import { ObjectHeader } from "./object-header";


/**
 * Container for object/subobject attributes.
 */
export const ObjectAttributes = ({ objectID, isSubobject = false }) => {
    // Don't render if object attributes are not present in the local state (to avoid errors after logout)
    const canRender = useSelector(state => state.objects[objectID] !== undefined);

    const timeStamp = !isSubobject && <ObjectTimeStamp objectID={objectID} />;

    return canRender && (
        <div className="objects-view-attributes">
            {timeStamp}
            <ObjectHeader objectID={objectID} isSubobject={isSubobject} />
            <ObjectDescription objectID={objectID} isSubobject={isSubobject} />
        </div>
    );
};
