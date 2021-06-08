import React from "react";
import Error from "../../../../common/error";

/**
 * Subobject card placeholder displayed when subobject data is unavailable and could not been fetched.
 */
export const ErrorPlaceholder = ({ fetchError }) => {
    return (
        <div className="composite-subobject-card no-padding">
            <Error header="Object is unavailable." text={fetchError} containerClassName="subobject-error-container" messageClassName="subobject-error-message" />
        </div>
    );
};
