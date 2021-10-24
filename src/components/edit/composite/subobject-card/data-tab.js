import React from "react";

import { ObjectViewEditSwitch } from "../../objects-edit";


/**
 * Subobject card "Data" tab content. 
 */
export const CardDataTab = ({ subobjectID }) => {
    return (
        <div className="composite-subobject-card-tab">
            <ObjectViewEditSwitch objectID={subobjectID} subobjectCard />
        </div>
    );
}; 