import React, { memo } from "react";
import { Checkbox } from "semantic-ui-react";

import StyleDisplayControls from "../../../../styles/modules/edit/display-controls.css";


/**
 * Display control checkbox component.
 * 
 * Implements UI logic only. Specific props should be provided by a wrapper component.
 */
export const DisplayControlCheckbox = memo(({ checked, indeterminate, onClick, label }) => {
    return (
        <div className="display-control-container">
            <Checkbox className="display-control-checkbox-container" 
                checked={checked} indeterminate={indeterminate} onClick={onClick} label={label} />
        </div>
    );
});
