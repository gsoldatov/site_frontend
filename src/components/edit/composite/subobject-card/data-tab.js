import React from "react";

import { ObjectViewEditSwitch } from "../../object";


/*
    Subobject card "General" tab content.
*/
export const CardDataTab = ({ subobjectID }) => {
    return (
        <div className="composite-subobject-card-tab">
            <ObjectViewEditSwitch objectID={subobjectID} disableComposite />
        </div>
    );
}; 