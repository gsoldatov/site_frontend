import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";

import { setEditedObject } from "../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-objects-edit";


/**
 * Component for setting `feed_timestamp` setting of an object or subobject.
 */
export const FeedTimestampSelector = ({ objectID }) => {
    const dispatch = useDispatch()

    // Get current feed_timestamp (ISO-formatted or empty string)
    const strFeedTimestamp = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).feed_timestamp);
    let feedTimestamp = new Date(strFeedTimestamp);
    if (isNaN(feedTimestamp.getTime())) feedTimestamp = null;

    // onChange handler
    const onChange = useMemo(() => e => {
        const newFeedTimestamp = e._d ? e._d.toISOString() : "";    // `_d` prop contains a date, if it's set; otherwise `e` does not have it
        dispatch(setEditedObject({ feed_timestamp: newFeedTimestamp }, objectID))
    }, [objectID]);

    return (
        <div className="objects-edit-display-control-container">
            <div className="objects-edit-timestamp-container">
                <div className="objects-edit-display-label">
                    Feed Timestamp
                </div>
                <Datetime value={feedTimestamp} onChange={onChange} />
            </div>
        </div>
    );
};