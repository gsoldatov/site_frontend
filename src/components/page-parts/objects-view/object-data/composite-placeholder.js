import React from "react";
import { Link } from "react-router-dom";


/**
 * Displays a placeholder for composite object data in a <ObjectsViewCard> for the provided `objectID`.
 */
export const CompositePlaceholder = ({ objectID }) => {
    const msg = "Click here to view the object";

    return (
        <div className="objects-view-data composite-subobject">
            <Link to={`/objects/view/${objectID}`}>
                {msg}
            </Link>
        </div>
    );
};
