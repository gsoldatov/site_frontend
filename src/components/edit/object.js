import React from "react";
import { Icon, Menu } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { LinkInput } from "./link";
import { MarkdownContainer } from "./markdown";
import { TDLContainer } from "./to-do-list";

import { setCurrentObject } from "../../actions/object";

import StyleObject from "../../styles/object.css";


/*
    Add/edit object sub-components
*/
// Object type selector
const objectTypes = [
    { key: 1, name: "link", title: "Link" },
    { key: 2, name: "markdown", title: "Markdown" },
    { key: 3, name: "to_do_list", title: "To-Do List" }
];
export const ObjectTypeSelector = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const isDisabled = id !== "add";
    const objectType = useSelector(state => state.objectUI.currentObject.object_type);

    const items = objectTypes.map(t => {
        const isActive = t.name === objectType;
        return (
            <Menu.Item as="div" key={t.key} name={t.name} className={isActive ? "active object-type" : "object-type"} disabled={isDisabled}
                onClick={(e, props) => dispatch(setCurrentObject({ object_type: props.name}))} >
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
export const ObjectViewEditSwitch = () => {
    const type = useSelector(state => state.objectUI.currentObject.object_type);

    switch (type) {
        case "link":
            return <LinkInput />;
        case "markdown":
            return <MarkdownContainer />;
        case "to_do_list":
            return <TDLContainer />;
        default:
            return <div>Not implemented</div>;
    }
};
