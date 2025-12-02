import React, { memo } from "react";
import { Checkbox } from "semantic-ui-react";

import StyleDisplayControls from "../../../../styles/modules/edit/display-controls.css";


interface DisplayControlCheckboxProps {
    checked: boolean,
    indeterminate?: boolean,
    onClick: (e: React.MouseEvent) => void,
    label: string
};


/**
 * Display control checkbox component.
 * 
 * Implements UI logic only. Specific props should be provided by a wrapper component.
 */
export const DisplayControlCheckbox = memo(({ checked, indeterminate, onClick, label }: DisplayControlCheckboxProps) => {
    indeterminate = indeterminate || false;
    
    return (
        <div className="display-control-container">
            <Checkbox className="display-control-checkbox-container" 
                checked={checked} indeterminate={indeterminate} onClick={onClick} label={label} />
        </div>
    );
});
