import React from "react";
import { useSelector } from "react-redux";
import { ObjectDataLink } from "./object-data-link";
import { ObjectDataMarkdown } from "./object-data-markdown";
import { ObjectDataToDoList } from "./object-data-to-do-list";
import { ObjectDataCompositeSubobject } from "./object-data-composite-subobject";
import { ObjectDataCompositeBasic } from "./object-data-composite-basic";

import { enumCompositeObjectDisplayModes } from "../../../util/enum-composite-object-display-modes";


/**
 * Switch component for object data on the /objects/view/:id page, based on object type and display properties.
 */
export const ObjectDataSwitch = ({ objectID, subobjectID, isSubobject = false }) => {
    const _id = isSubobject ? subobjectID : objectID;
    const canRender = useSelector(state => state.objects[_id] !== undefined);
    const objectType = useSelector(state => (state.objects[_id] || {}).object_type);
    const compositeDisplayMode = useSelector(state => (state.composite[_id] || {}).display_mode);

    // Don't render if object attributes are not present in the local state (to avoid errors after logout)
    if (!canRender) return null;

    switch (objectType) {
        case "link":
            return <ObjectDataLink objectID={objectID} subobjectID={subobjectID} isSubobject={isSubobject} />;
        case "markdown":
            return <ObjectDataMarkdown objectID={_id} />;
        case "to_do_list":
            return <ObjectDataToDoList objectID={_id} />;
        case "composite":
            if (isSubobject) return <ObjectDataCompositeSubobject objectID={_id} />;

            switch (compositeDisplayMode) {
                case enumCompositeObjectDisplayModes.basic.value:
                    return <ObjectDataCompositeBasic objectID={_id} />;
                default:
                    throw Error(`Received unknown displayMode '${compositeDisplayMode}' for composite object '${_id}'`)
            }
            
        default:
            return null;
    }
};
