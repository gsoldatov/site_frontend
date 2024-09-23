import React, { memo } from "react";
import { Dropdown } from "semantic-ui-react";

import StyleDisplayControls from "../../../styles/modules/edit/display-controls.css";


/**
 * Display control dropdown component.
 * 
 * Implements UI logic only. Specific props should be provided by a wrapper component.
 */
export const DisplayControlDropdown = memo(({ options, value, onChange, label }) => {
    return (
        <div className="display-control-container">
            <div className="display-control-dropdown-container">
                <div className="display-control-label" title={label}>
                    {label}
                </div>
                <Dropdown className="display-control-dropdown"
                    selection
                    options={options}
                    value={value}
                    onChange={onChange}
                />
            </div>
        </div>
    );
});
