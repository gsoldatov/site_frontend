import React, { useMemo, memo } from "react";
import { Checkbox, Dropdown, Icon } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { DefaultObjectData } from "./default-object-data";
import { LinkInput } from "./link";
import { MarkdownContainer } from "./markdown";
import { TDLContainer } from "./to-do-list/to-do-list";
import { SubobjectsContainer } from "./composite/subobjects";

import { setEditedObject } from "../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../store/state-util/ui-objects-edit";
import { enumObjectTypes } from "../../util/enum-object-types";

import StyleObjectsEdit from "../../styles/objects-edit.css";


/*
    Add/edit object sub-components
*/
const objectTypeDropdownOptions = Object.values(enumObjectTypes).map((t, k) => ({ key: k, text: t.name, value: t.type, icon: t.icon }));
const newSubobjectDropdownOptions = objectTypeDropdownOptions.filter(option => option.value !== "composite");


/**
 * Object type selector component.
 */
export const ObjectTypeSelector = memo(({ objectID, isSubobject = false }) => {
    const dispatch = useDispatch();

    const isDisabled = objectID > 0;
    const objectType = useSelector(getEditedOrDefaultObjectSelector(objectID)).object_type;

    // Header style
    const headerClassName = "object-type-menu-header" + (isSubobject ? " subobject": "");

    // On change callback
    const onChange = useMemo(() => (e, data) => {
        dispatch(setEditedObject({ object_type: data.value }, objectID));
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
        <>
            <div className={headerClassName}>Object Type</div>
            {/* <Dropdown selection className="object-type-dropdown-switch" */}
            <Dropdown className="selection object-type-dropdown-switch"     // Add SUIR classname for styling (`selection` prop is not compatible with `trigger`)
                disabled={isDisabled}
                defaultValue={objectType}
                trigger={trigger}
                options={options}
                onChange={onChange}
            />
        </>
    );
});


/**
 * Component for switching type-specific view/edit components.
 * 
 * If `subobjectCard` is true, displays default component for composite objects and styles if accordingly.
 */
export const ObjectViewEditSwitch = ({ objectID, subobjectCard = false }) => {
    const editedOrDefaultObjectSelector = useMemo(() => getEditedOrDefaultObjectSelector(objectID), [objectID]);
    const objectTypeSelector = useMemo(() => state => editedOrDefaultObjectSelector(state).object_type, [objectID]);
    const objectType = useSelector(objectTypeSelector);

    switch (objectType) {
        case "link":
            return <LinkInput objectID={objectID} />;
        case "markdown":
            return <MarkdownContainer objectID={objectID} />;
        case "to_do_list":
            return <TDLContainer objectID={objectID} />;
        case "composite":
            if (subobjectCard)
                return <DefaultObjectData objectID={objectID} subobjectCard />;
            else
                return <SubobjectsContainer objectID={objectID} />;
        default:
            return <DefaultObjectData objectID={objectID} subobjectCard={subobjectCard} />;
    }
};


/**
 * Component for switching `is_published` setting of the object or composite subobject.
 */
export const ObjectIsPublishedSwitch = ({ objectID }) => {
    const dispatch = useDispatch();

    const editedOrDefaultObjectSelector = useMemo(() => getEditedOrDefaultObjectSelector(objectID), [objectID]);
    const isPublishedSelector = useMemo(() => state => editedOrDefaultObjectSelector(state).is_published, [objectID]);
    const isPublished = useSelector(isPublishedSelector);
    const onClick = useMemo(() => () => dispatch(setEditedObject({ is_published: !isPublished }, objectID)), [objectID, isPublished]);

    return (
        <Checkbox className="object-is-published-checkbox-container" checked={isPublished} onClick={onClick} label="Publish Object" />
    );
};


/**
 * Component for switching `is_published` setting of a component object's subobjects.
 */
export const SubobjectsIsPublishedSwitch = ({ objectID }) => {
    const dispatch = useDispatch();

    const subobjectsIsPublishedStateSelector = useMemo(() => state => {
        const editedObject = getEditedOrDefaultObjectSelector(objectID)(state);
        let numberOfSubobjects = 0, numberOfPublishedSubobjects = 0;

        Object.keys(editedObject.composite.subobjects).forEach(subobjectID => {
            if (subobjectID in state.editedObjects) {
                numberOfSubobjects++;
                if (state.editedObjects[subobjectID].is_published) numberOfPublishedSubobjects++;
            }
        });
        return numberOfSubobjects === numberOfPublishedSubobjects ? "yes"
            : numberOfPublishedSubobjects > 0 ? "partially" : "no";
    }, [objectID]);
    const subobjectsIsPublishedState = useSelector(subobjectsIsPublishedStateSelector);

    const onClick = useMemo(() => () =>
        dispatch(setEditedObject({ compositeUpdate: { command: "toggleSubobjectsIsPublished", subobjectsIsPublishedState }}, objectID))
    , [objectID, subobjectsIsPublishedState])

    const objectTypeSelector = useMemo(() => state => getEditedOrDefaultObjectSelector(objectID)(state).object_type, [objectID]);
    const objectType = useSelector(objectTypeSelector);

    if (objectType !== "composite") return null;

    return (
        <Checkbox className="object-is-published-checkbox-container" checked={subobjectsIsPublishedState === "yes"} 
            indeterminate={subobjectsIsPublishedState === "partially"} onClick={onClick} label="Publish Subobjects" />
    );
};
