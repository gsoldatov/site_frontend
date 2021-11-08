import React from "react";
import { useSelector } from "react-redux";
import { ObjectDataLink } from "./object-data-link";
import { ObjectDataMarkdown } from "./object-data-markdown";
import { ObjectDataToDoList } from "./object-data-to-do-list";
import { ObjectDataCompositeSubobject } from "./object-data-composite-subobject";
import { ObjectDataCompositeBasic } from "./object-data-composite-basic";


/**
 * Switch component for object data on the /objects/view/:id page, based on object type and display properties.
 */
export const ObjectDataSwitch = ({ objectID, isSubobject = false }) => {
    const canRender = useSelector(state => state.objects[objectID] !== undefined);
    const objectType = useSelector(state => (state.objects[objectID] || {}).object_type);

    // Don't render if object attributes are not present in the local state (to avoid errors after logout)
    if (!canRender) return null;

    switch (objectType) {
        case "link":
            return <ObjectDataLink objectID={objectID} />;
        case "markdown":
            return <ObjectDataMarkdown objectID={objectID} />;
        case "to_do_list":
            return <ObjectDataToDoList objectID={objectID} />;
        case "composite":
            if (isSubobject) return <ObjectDataCompositeSubobject objectID={objectID} />;
            return <ObjectDataCompositeBasic objectID={objectID} />;
        default:
            return null;
    }
};
