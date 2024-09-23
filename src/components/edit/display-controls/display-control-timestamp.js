import React, { memo } from "react";

import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";

import StyleDisplayControls from "../../../styles/modules/edit/display-controls.css";


/**
 * Display control timestamp selection component.
 * 
 * Implements UI logic only. Specific props should be provided by a wrapper component.
 */
export const DisplayControlTimestampSelector = memo(({ stringTimestamp, onChange, label }) => {
    // Set correct value for <Datetime> component
    let timestamp = new Date(stringTimestamp);              // `Date` object if `stringTimestamp` contains a valid date
    if (isNaN(timestamp.getTime())) timestamp = undefined;  // undefined otherwise

    // Custom render input, which contains an empty string if a date is not set
    const renderInput = props => <input {...props} value={(timestamp) ? props.value : ""} />;

    return (
        <div className="display-control-container">
            <div className="display-control-timestamp-container">
                <div className="display-control-label" title={label}>
                    {label}
                </div>
                <Datetime value={timestamp} onChange={onChange}
                    renderInput={renderInput} />
            </div>
        </div>
    );
});
