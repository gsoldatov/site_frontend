import React from "react";

import { ObjectTimeStamp } from "./object-timestamp";
import { ObjectDescription } from "./object-description";
import { ObjectHeader } from "./object-header";


/**
 * Container for object/subobject attributes.
 */
export const ObjectAttributes = ({ objectID }) => {
    return (
        <div className="objects-view-attributes">
            <ObjectTimeStamp objectID={objectID} />
            <ObjectHeader objectID={objectID} />
            <ObjectDescription objectID={objectID} />
        </div>
    );
};
