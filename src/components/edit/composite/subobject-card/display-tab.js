import React from "react";

import { ObjectIsPublishedSwitch } from "../../object";


/**
 * Subobject card "Display" tab content. 
 */
export const CardDisplayTab = ({ subobjectID }) => {
    return (
        <div className="composite-subobject-card-tab">
            <ObjectIsPublishedSwitch objectID={subobjectID} />
        </div>
    );
}; 