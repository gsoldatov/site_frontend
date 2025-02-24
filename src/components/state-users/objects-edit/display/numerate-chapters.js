import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlCheckbox } from "../../../modules/edit/display/display-control-checkbox";

import { updateEditedObject } from "../../../../reducers/data/edited-objects";
import { ObjectsEditSelectors } from "../../../../store/selectors/ui/objects-edit";


/**
 * Component for switching `numerate_chapters` setting of a composite object.
 */
 export const NumerateChaptersSwitch = ({ objectID }) => {
    const dispatch = useDispatch();

    const isRendered = useSelector(state => {
        const editedObject = ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state);
        return editedObject.object_type === "composite" && editedObject.composite.display_mode === "chapters";
    });

    const numerateChapters = useSelector(state => ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).composite.numerate_chapters);

    const onClick = useMemo(() => (e, data) => {
        dispatch(updateEditedObject(objectID, { composite: { numerate_chapters: data.checked }}));
    }, [objectID]);

    return isRendered && (
        <DisplayControlCheckbox checked={numerateChapters} onClick={onClick} label="Numerate Chapters" />
    );
};
