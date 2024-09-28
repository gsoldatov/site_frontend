import React from "react";

import { DisplayTab } from "../../../display/display-tab";


/**
 * Subobject card "Display" tab content. 
 */
export const CardDisplayTab = ({ objectID, subobjectID }) => {
    return (
        <div className="composite-subobject-card-tab">
            <DisplayTab objectID={objectID} subobjectID={subobjectID} isSubobject />
        </div>
    );
}; 