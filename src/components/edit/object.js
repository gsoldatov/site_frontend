import React, { useRef, useState } from "react";
import { Icon, Menu } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { OnResizeWrapper } from "../common/on-resize-wrapper";
import { DefaultObjectData } from "./default-object-data";
import { LinkInput } from "./link";
import { MarkdownContainer } from "./markdown";
import { TDLContainer } from "./to-do-list/to-do-list";
import { SubobjectsContainer } from "./composite/subobjects";

import { setEditedObject } from "../../actions/object";
import { getEditedOrDefaultObjectSelector } from "../../store/state-util/ui-object";

import StyleObject from "../../styles/object.css";


/*
    Add/edit object sub-components
*/
// Object type selector
const objectTypes = [
    { name: "link", title: "Link" },
    { name: "markdown", title: "Markdown" },
    { name: "to_do_list", title: "To-Do List" },
    { name: "composite", title: "Composite" }
];
const newSubobjectTypes = objectTypes.filter(t => t.name !== "composite");

export const ObjectTypeSelector = ({ objectID, isSubobject = false }) => {
    const dispatch = useDispatch();

    const isDisabled = objectID > 0;
    const objectType = useSelector(getEditedOrDefaultObjectSelector(objectID)).object_type;

    // Header style
    const headerClassName = "object-type-menu-header" + (isSubobject ? " subobject": "");

    // Fullscreen style state
    const [isFullscreenStyle, setIsFullscreenStyle] = useState(true);
    const menuClassName = isFullscreenStyle ? "object-type-menu" : "object-type-menu small";

    // Items
    const displayedObjectTypes = isSubobject && !isDisabled ? newSubobjectTypes : objectTypes;   // disable adding new composite subobjects
    const items = displayedObjectTypes.map((t, k) => {
        const isActive = t.name === objectType;
        let className = isActive ? "active object-type" : "object-type";
        if (!isFullscreenStyle) className += " small";
        
        return (
            <Menu.Item as="div" key={k} name={t.name} className={className} disabled={isDisabled}
                onClick={(e, props) => dispatch(setEditedObject({ object_type: props.name}, objectID))} >
                {isActive ? <Icon name="check" /> : null}
                    {t.title}
            </Menu.Item>
        );
    });

    // each item has a fixed width of 125px in fullscreen mode; update CSS if this is updated
    return (
        <>
            <div className={headerClassName}>Object Type</div>
            <OnResizeWrapper threshold={125 * displayedObjectTypes.length} callback={setIsFullscreenStyle}>
                <Menu compact className={menuClassName}>
                    {items}
                </Menu>
            </OnResizeWrapper>
        </>
    );
};


// Component for switching type-specific view/edit components.
// If `subobjectCard` is true, displays default component for composite objects and styles if accordingly.
export const ObjectViewEditSwitch = ({ objectID, subobjectCard = false }) => {
    const objectType = useSelector(getEditedOrDefaultObjectSelector(objectID)).object_type;

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
