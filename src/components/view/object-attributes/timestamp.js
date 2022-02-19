import React from "react";
import { useSelector } from "react-redux";
import moment from "moment";


/**
 * Object timestamp, displayed inside an <ObjectsViewCard>.
 */
export const Timestamp = ({ objectID, timestampProps = {} }) => {
    const displayTimestamp = timestampProps.displayTimestamp !== undefined ? timestampProps.displayTimestamp : true;

    const timestampValue = moment(useSelector(state => {
        const object = state.objects[objectID];
        return object.feed_timestamp || object.modified_at;
    })).format("lll");

    return displayTimestamp && (
        <div className="objects-view-timestamp">
            {timestampValue}
        </div>
    );
};
