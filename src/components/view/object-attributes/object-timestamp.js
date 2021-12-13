import React from "react";
import { useSelector } from "react-redux";
import moment from "moment";


/**
 * Object view page timestamp.
 */
export const ObjectTimeStamp = ({ objectID }) => {
    const timestampValue = moment(useSelector(state => {
        const object = state.objects[objectID];
        return object.feed_timestamp || object.modified_at;
    })).format("lll");

    return (
        <div className="objects-view-timestamp">
            {timestampValue}
        </div>
    );
};
