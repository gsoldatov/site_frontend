import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlCheckbox } from "../../../modules/edit/display/display-control-checkbox";
import { DisplayControlDropdown } from "../../../modules/edit/display/display-control-dropdown";

import { setEditedObject } from "../../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../../store/state-util/ui-objects-edit";
import { showDescriptionCompositeOptions } from "../../../../store/types/ui/general/show-description-composite";


/**
 * Component for switching `show_description` setting of an object.
 */
 export const ShowDescriptionSwitch = ({ objectID }) => {
    const dispatch = useDispatch();
    const showDescription = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).show_description);
    const onClick = useMemo(() => () => dispatch(setEditedObject({ show_description: !showDescription }, objectID)), [objectID, showDescription]);

    return (
        <DisplayControlCheckbox checked={showDescription} onClick={onClick} label="Show Description" />
    );
};


const showDescriptionDropdownOptions = Object.values(showDescriptionCompositeOptions).map((t, k) => ({ key: k, text: t.name, value: t.value }));

/**
 * Component for switching `show_description_composite` setting of a composite object's subobject.
 */
export const SubobjectShowDescriptionSwitch = ({ objectID, subobjectID }) => {
    const dispatch = useDispatch();

    // Current value
    const showDescription = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).composite.subobjects[subobjectID].show_description_composite);

    // On change callback
    const onChange = useMemo(() => 
        (e, data) => dispatch(setEditedObject({ compositeUpdate: { command: "updateSubobject", subobjectID, show_description_composite: data.value }}, objectID))
    , [objectID, subobjectID]);

    return (
        <DisplayControlDropdown options={showDescriptionDropdownOptions} value={showDescription} 
            onChange={onChange} label="Show Description in Parent Object" />
    );
};
