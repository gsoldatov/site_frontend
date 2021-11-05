import React from "react";
import { useSelector } from "react-redux";
import { ObjectDataLink } from "./object-data-link";
import { ObjectDataMarkdown } from "./object-data-markdown";


/**
 * Switch component for object data on the /objects/view/:id page, based on object type and display properties.
 */
export const ObjectDataSwitch = ({ objectID }) => {
    const objectType = useSelector(state => state.objects[objectID].object_type);

    switch (objectType) {
        case "link":
            return <ObjectDataLink objectID={objectID} />;
        case "markdown":
            return <ObjectDataMarkdown objectID={objectID} />;
        default:
            return null;
    }
};
