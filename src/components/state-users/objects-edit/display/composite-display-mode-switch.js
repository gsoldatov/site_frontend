import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DisplayControlDropdown } from "../../../modules/edit/display/display-control-dropdown";

import { updateEditedObject } from "../../../../reducers/data/edited-objects";
import { ObjectsEditSelectors } from "../../../../store/selectors/ui/objects-edit";
import { compositeDisplayModeOptions } from "../../../../store/types/ui/general/composite-display-mode";


const showDescriptionDropdownOptions = Object.values(compositeDisplayModeOptions).map((t, k) => ({ key: k, text: t.name, value: t.value }));


/**
 * Component for switching `display_mode` setting of a composite object.
 */
export const CompositeDisplayModeSwitch = ({ objectID }) => {
    const dispatch = useDispatch();

    // Current value
    const isComposite = useSelector(state => ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).object_type === "composite");
    const displayMode = useSelector(state => ObjectsEditSelectors.editedOrDefaultSelector(objectID)(state).composite.display_mode);

    // On change callback
    const onChange = useMemo(() => (e, data) => {
        dispatch(updateEditedObject(objectID, { composite: { display_mode: data.value }}));
    }, [objectID]);

    return isComposite && (
        <DisplayControlDropdown options={showDescriptionDropdownOptions} value={displayMode} 
            onChange={onChange} label="Composite Object Display Mode" />
    );
};
