import React, { useMemo } from "react";
import { Checkbox } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { setEditedObject } from "../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-objects-edit";


/**
 * Component for switching `display_in_feed` setting of an object or subobject.
 */
export const DisplayInFeedSwitch = ({ objectID }) => {
    const dispatch = useDispatch();
    const displayInFeed = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).display_in_feed);
    const onClick = useMemo(() => () => dispatch(setEditedObject({ display_in_feed: !displayInFeed }, objectID)), [objectID, displayInFeed]);

    return (
        <div className="objects-edit-display-control-container">
            <Checkbox className="objects-edit-display-checkbox-container" checked={displayInFeed} onClick={onClick} label="Display in Feed" />
        </div>
    );
};
