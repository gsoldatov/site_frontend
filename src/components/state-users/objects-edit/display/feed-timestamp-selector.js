import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlTimestampSelector } from "../../../modules/edit/display/display-control-timestamp";

import { updateEditedObject } from "../../../../reducers/data/edited-objects";
import { ObjectsEditSelectors } from "../../../../store/selectors/ui/objects-edit";


/**
 * Component for setting `feed_timestamp` setting of an object or subobject.
 */
export const FeedTimestampSelector = ({ objectID }) => {
    const dispatch = useDispatch()

    const feedTimestamp = useSelector(state => ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).feed_timestamp);

    // onChange handler
    const onChange = useMemo(() => e => {
        const newFeedTimestamp = e._d ? e._d.toISOString() : "";    // `_d` prop contains a date, if it's set; otherwise `e` does not have it
        dispatch(updateEditedObject(objectID, { feed_timestamp: newFeedTimestamp }));
    }, [objectID]);

    return (
        <DisplayControlTimestampSelector stringTimestampOrNull={feedTimestamp} onChange={onChange} label="Feed Timestamp" />
    );
};
