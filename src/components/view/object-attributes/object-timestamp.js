import React from "react";
import { useSelector } from "react-redux";


/**
 * Object view page timestamp.
 */
export const ObjectTimeStamp = ({ objectID }) => {
    const timestamp = new Date(useSelector(state => state.objects[objectID].modified_at)).toLocaleString();

    return (
        <div className="objects-view-timestamp">
            {timestamp}
        </div>
    );
};
