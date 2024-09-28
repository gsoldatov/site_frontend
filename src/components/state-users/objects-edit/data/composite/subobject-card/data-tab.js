import React from "react";

import { ObjectDataSwitch } from "../../object-data-switch";


/**
 * Subobject card "Data" tab content. 
 */
export const CardDataTab = ({ subobjectID }) => {
    return (
        <div className="composite-subobject-card-tab">
            <ObjectDataSwitch objectID={subobjectID} subobjectCard />
        </div>
    );
}; 