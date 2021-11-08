import React from "react";
import { Link } from "react-router-dom";


/**
 * Composite subobject's object data display component on the /objects/view/:id page.
 */
export const ObjectDataCompositeSubobject = ({ objectID }) => {
    const msg = "Click here to view the object";

    return (
        <Link to={`/objects/view/${objectID}`}>
            {msg}
        </Link>
    );
};
