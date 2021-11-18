import React, { useMemo } from "react";
import { Checkbox, Dropdown } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { setEditedObject } from "../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-objects-edit";
import { enumCompositeObjectDisplayModes } from "../../../util/enum-composite-object-display-modes";


const showDescriptionDropdownOptions = Object.values(enumCompositeObjectDisplayModes).map((t, k) => ({ key: k, text: t.name, value: t.value }));

/**
 * Component for switching `display_mode` setting of a composite object.
 */
export const CompositeDisplayModeSwitch = ({ objectID }) => {
    const dispatch = useDispatch();

    // Current value
    const isComposite = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).object_type === "composite");
    const displayMode = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).composite.display_mode);

    // On change callback
    const onChange = useMemo(() => 
        (e, data) => dispatch(setEditedObject({ composite: { display_mode: data.value }}, objectID))
    , [objectID]);

    return isComposite && (
        <div className="objects-edit-display-control-container">
            <div className="objects-edit-display-dropdown-container">
                <div className="objects-edit-display-label">
                    Composite Object Display Mode
                </div>
                <Dropdown className="objects-edit-display-dropdown"
                    selection
                    value={displayMode}
                    options={showDescriptionDropdownOptions}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};
