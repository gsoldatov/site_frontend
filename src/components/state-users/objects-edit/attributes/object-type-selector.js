import React, { useMemo, memo } from "react";
import { Dropdown, Icon } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { updateEditedObject } from "../../../../reducers/data/edited-objects";
import { ObjectsEditSelectors } from "../../../../store/selectors/ui/objects-edit";
import { objectTypeOptions } from "../../../../types/store/ui/general/object-type";


/**
 * Object type selector component.
 */
export const ObjectTypeSelector = memo(({ objectID, isSubobject = false }) => {
    const dispatch = useDispatch();

    // Dropdown options
    const objectTypeDropdownOptions = useMemo(() => Object.values(objectTypeOptions).map((t, k) => ({ key: k, text: t.name, value: t.type, icon: t.icon })), []);
    const newSubobjectDropdownOptions = useMemo(() => objectTypeDropdownOptions.filter(option => option.value !== "composite"), []);

    const isDisabled = objectID > 0;
    const editedOrDefaultObjectSelector = useMemo(() => ObjectsEditSelectors.editedOrDefaultSelector(objectID), [objectID]);
    const objectType = useSelector(state => editedOrDefaultObjectSelector(state).object_type);

    // Header style
    const headerClassName = "object-type-menu-header" + (isSubobject ? " subobject": "");

    // On change callback
    const onChange = useMemo(() => (e, data) => {
        dispatch(updateEditedObject(objectID, { object_type: data.value }));
    }, [objectID]);

    // Dropdown options
    const options = isSubobject && !isDisabled ? newSubobjectDropdownOptions : objectTypeDropdownOptions;   // disable adding new composite subobjects

    // Add icon to the left of selected option text (by replacing standart text with a custom element)
    const selectedOption = objectTypeDropdownOptions.filter(option => option.value === objectType)[0];
    const trigger = useMemo(() => (
        <span className="selected-object-type">
            <Icon name={selectedOption.icon} /> {selectedOption.text}
        </span>
    ), [objectType]);

    return (
        <div className="object-type-menu-container">
            <div className={headerClassName}>Object Type</div>
            {/* <Dropdown selection className="object-type-dropdown-switch" */}
            <Dropdown className="selection object-type-dropdown-switch"     // Add SUIR classname for styling (`selection` prop is not compatible with `trigger`)
                disabled={isDisabled}
                trigger={trigger}
                options={options}
                onChange={onChange}
                value={objectType}      // make component controlled by `objectType` of the object it's displayed for
            />
        </div>
    );
});
