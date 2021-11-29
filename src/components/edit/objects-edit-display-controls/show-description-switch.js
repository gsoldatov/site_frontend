import React, { useMemo } from "react";
import { Checkbox, Dropdown } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { setEditedObject } from "../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-objects-edit";
import { enumShowDescriptionComposite } from "../../../store/state-templates/composite-subobjects";

/**
 * Component for switching `show_description` setting of an object.
 */
export const ShowDescriptionSwitch = ({ objectID }) => {
    const dispatch = useDispatch();
    const showDescription = useSelector(state => getEditedOrDefaultObjectSelector(objectID)(state).show_description);
    const onClick = useMemo(() => () => dispatch(setEditedObject({ show_description: !showDescription }, objectID)), [objectID, showDescription]);

    return (
        <div className="objects-edit-display-control-container">
            <Checkbox className="objects-edit-display-checkbox-container" checked={showDescription} onClick={onClick} label="Show Description" />
        </div>
    );
};


const showDescriptionDropdownOptions = Object.values(enumShowDescriptionComposite).map((t, k) => ({ key: k, text: t.name, value: t.value }));

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
        <div className="objects-edit-display-control-container">
            <div className="objects-edit-display-dropdown-container">
                <div className="objects-edit-display-label">
                    Show Description in Parent Object
                </div>
                <Dropdown className="objects-edit-display-dropdown"
                    selection
                    value={showDescription}
                    options={showDescriptionDropdownOptions}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};
