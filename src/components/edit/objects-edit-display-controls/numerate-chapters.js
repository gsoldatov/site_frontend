import React, { useMemo } from "react";
import { Checkbox } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { setEditedObject } from "../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-objects-edit";
import { enumCompositeObjectDisplayModes } from "../../../util/enum-composite-object-display-modes";


/**
 * Component for switching `numerate_chapters` setting of a composite object.
 */
export const NumerateChaptersSwitch = ({ objectID }) => {
    const dispatch = useDispatch();

    const isRendered = useSelector(state => {
        const editedObject = getEditedOrDefaultObjectSelector(objectID)(state);
        return editedObject.object_type === "composite" && editedObject.composite.display_mode === enumCompositeObjectDisplayModes.chapters.value;
    });

    const numerateChapters = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).composite.numerate_chapters);

    const onClick = useMemo(() => (e, data) => {
        dispatch(setEditedObject({ composite: { numerate_chapters: data.checked }}, objectID));
    }, [objectID]);

    return isRendered && (
        <div className="objects-edit-display-control-container">
            <Checkbox className="objects-edit-display-checkbox-container" checked={numerateChapters} onClick={onClick} label="Numerate Chapters" />
        </div>
    );
};
