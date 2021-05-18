import React, { useRef } from "react";
import { Icon, Menu } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { LinkInput } from "./link";
import { MarkdownContainer } from "./markdown";
import { TDLContainer } from "./to-do-list/to-do-list";

import { setEditedObject } from "../../actions/object";
import { getEditedOrDefaultObjectSelector } from "../../store/state-util/ui-object";

import StyleObject from "../../styles/object.css";


/*
    Add/edit object sub-components
*/
// Object type selector
const objectTypes = [
    { key: 1, name: "link", title: "Link" },
    { key: 2, name: "markdown", title: "Markdown" },
    { key: 3, name: "to_do_list", title: "To-Do List" },
    { key: 4, name: "composite", title: "Composite" }
];
export const ObjectTypeSelector = ({ objectID }) => {
    const dispatch = useDispatch();

    const objectSelector = useRef(getEditedOrDefaultObjectSelector(objectID)).current;
    
    const isDisabled = objectID > 0;
    const objectType = useSelector(objectSelector).object_type;

    const items = objectTypes.map(t => {
        const isActive = t.name === objectType;
        return (
            <Menu.Item as="div" key={t.key} name={t.name} className={isActive ? "active object-type" : "object-type"} disabled={isDisabled}
                onClick={(e, props) => dispatch(setEditedObject({ object_type: props.name}))} >
                {isActive ? <Icon name="check" /> : null}
                    {t.title}
            </Menu.Item>
        );
    });

    return (
        <>
            <div className="object-type-menu-header">Object Type</div>
            <Menu compact className="object-type-menu">
                {items}
            </Menu>
        </>
    );
};


// Component for switching type-specific view/edit components
export const ObjectViewEditSwitch = ({ objectID }) => {
    const objectSelector = useRef(getEditedOrDefaultObjectSelector(objectID)).current;
    const objectType = useSelector(objectSelector).object_type;

    switch (objectType) {
        case "link":
            return <LinkInput objectID={objectID} />;
        case "markdown":
            return <MarkdownContainer objectID={objectID} />;
        case "to_do_list":
            return <TDLContainer />;
        default:
            return <div>Not implemented</div>;
    }
};
