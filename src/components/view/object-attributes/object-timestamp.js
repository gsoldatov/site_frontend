import React from "react";
import { useSelector } from "react-redux";


/**
 * Object view page timestamp.
 */
export const ObjectTimeStamp = ({ objectID }) => {
    const timestampValue = new Date(useSelector(state => {
        const object = state.objects[objectID];
        return object.feed_timestamp || object.modified_at;
    })).toLocaleString();

    return (
        <div className="objects-view-timestamp">
            {timestampValue}
        </div>
    );
};
