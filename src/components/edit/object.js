import React, { useRef, useState, useEffect } from "react";
import { Icon, Menu, Ref } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { LinkInput } from "./link";
import { MarkdownContainer } from "./markdown";
import { TDLContainer } from "./to-do-list/to-do-list";
import { SubobjectsContainer } from "./composite/subobjects";

import { setEditedObject } from "../../actions/object";
import { getEditedOrDefaultObjectSelector } from "../../store/state-util/ui-object";
import intervalWrapper from "../../util/interval-wrapper";

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

    // onResize style update logic
    const menuRef = useRef()
    const [menuStyle, setMenuStyle] = useState("fullscreen");
    const menuClassName = menuStyle === "fullscreen" ? "object-type-menu" : "object-type-menu small";
    const onResize = useRef(intervalWrapper(() => {
        if (menuRef.current) {
            const menuWidth = parseInt(getComputedStyle(menuRef.current).width.replace("px", ""));
            const minFullscreenWidth = 125 * objectTypes.length;    // each item has a fixed width of 125px in fullscreen mode; update CSS if this is updated
            const newMenuStyle = menuWidth > minFullscreenWidth ? "fullscreen" : "small";
            setMenuStyle(newMenuStyle);
        }
    }, 200, false)).current;

    // Add/remove window on resize event listener and run onResize handler
    useEffect(() => {
        onResize();
        window.addEventListener("resize", onResize);
        return () => {  window.removeEventListener("resize", onResize); }
    }, []);

    // Items
    const items = objectTypes.map(t => {
        const isActive = t.name === objectType;
        return (
            <Menu.Item as="div" key={t.key} name={t.name} className={isActive ? "active object-type" : "object-type"} disabled={isDisabled}
                onClick={(e, props) => dispatch(setEditedObject({ object_type: props.name}, objectID))} >
                {isActive ? <Icon name="check" /> : null}
                    {t.title}
            </Menu.Item>
        );
    });

    return (
        <>
            <div className="object-type-menu-header">Object Type</div>
            <Ref innerRef={menuRef}>
                <Menu compact className={menuClassName}>
                    {items}
                </Menu>
            </Ref>
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
            return <TDLContainer objectID={objectID} />;
        case "composite":
            return <SubobjectsContainer objectID={objectID} />;
        default:
            return <div>Not implemented</div>;
    }
};
