import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlCheckbox } from "../../../modules/edit/display/display-control-checkbox";

import { updateEditedObject } from "../../../../reducers/data/edited-objects";
import { ObjectsEditSelectors } from "../../../../store/selectors/ui/objects-edit";


/**
 * Component for switching `display_in_feed` setting of an object or subobject.
 */
export const DisplayInFeedSwitch = ({ objectID }) => {
    const dispatch = useDispatch();
    const displayInFeed = useSelector(state => ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).display_in_feed);
    const onClick = useMemo(() => () => dispatch(updateEditedObject(objectID, { display_in_feed: !displayInFeed })), [objectID, displayInFeed]);

    return (
        <DisplayControlCheckbox checked={displayInFeed} onClick={onClick} label="Display in Feed" />
    );
};
