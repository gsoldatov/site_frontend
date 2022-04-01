import React, { useMemo, memo } from "react";
import { Dropdown, Icon } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { DefaultObjectData } from "./default-object-data";
import { LinkInput } from "./link";
import { MarkdownDataEditor } from "./markdown";
import { TDLContainer } from "./to-do-list/to-do-list";
import { SubobjectsContainer } from "./composite/subobjects";

import { setEditedObject } from "../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../store/state-util/ui-objects-edit";
import { getIsTDLDragAndDropEnabledSelector } from "../../store/state-util/to-do-lists";
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
    const dispatch = useDispatch();
    const editedOrDefaultObjectSelector = useMemo(() => getEditedOrDefaultObjectSelector(objectID), [objectID]);
    const objectTypeSelector = useMemo(() => state => editedOrDefaultObjectSelector(state).object_type, [objectID]);
    const objectType = useSelector(objectTypeSelector);

    // To-do list props
    const toDoList = useSelector(getEditedOrDefaultObjectSelector(objectID)).toDoList;
    const canDragToDoList = useSelector(getIsTDLDragAndDropEnabledSelector(objectID));
    const toDoListUpdateCallback = useMemo(
        () => params => dispatch(setEditedObject(params, objectID))
    , [objectID]);

    switch (objectType) {
        case "link":
            return <LinkInput objectID={objectID} />;
        case "markdown":
            return <MarkdownDataEditor objectID={objectID} />;
        case "to_do_list":
            return <TDLContainer objectID={objectID} toDoList={toDoList} canDrag={canDragToDoList} updateCallback={toDoListUpdateCallback} />;
        case "composite":
            if (subobjectCard)
                return <DefaultObjectData objectID={objectID} subobjectCard />;
            else
                return <SubobjectsContainer objectID={objectID} />;
        default:
            return <DefaultObjectData objectID={objectID} subobjectCard={subobjectCard} />;
    }
};
