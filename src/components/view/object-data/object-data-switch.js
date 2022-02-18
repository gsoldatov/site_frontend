import React from "react";
import { useSelector } from "react-redux";

import { ObjectDataLink } from "./object-data-link";
import { ObjectDataMarkdown } from "./object-data-markdown";
import { ObjectDataToDoList } from "./object-data-to-do-list";
import { ObjectDataCompositeSubobject } from "./object-data-composite-subobject";
import { ObjectDataCompositeBasic } from "./object-data-composite-basic";
import { ObjectDataCompositeGroupedLinks } from "./object-data-composite-grouped-links";
import { ObjectDataCompositeMulticolumn } from "./object-data-composite-multicolumn";

import { enumCompositeObjectDisplayModes } from "../../../util/enum-composite-object-display-modes";
import { ObjectDataCompositeChapters } from "./object-data-composite-chapters/object-data-composite-chapters";
import { objectDataIsInState } from "../../../store/state-util/objects";


/**
 * Switch component for object data on the /objects/view/:id page, based on object type and display properties.
 */
export const ObjectDataSwitch = ({ objectID, subobjectID, isSubobject = false }) => {
    const _id = isSubobject ? subobjectID : objectID;
    const canRender = useSelector(state => objectDataIsInState(state, _id));
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
                case enumCompositeObjectDisplayModes.groupedLinks.value:
                    return <ObjectDataCompositeGroupedLinks objectID={_id} />;
                case enumCompositeObjectDisplayModes.multicolumn.value:
                    return <ObjectDataCompositeMulticolumn objectID={_id} />;
                case enumCompositeObjectDisplayModes.chapters.value:
                    return <ObjectDataCompositeChapters objectID={_id} />;
                default:
                    throw Error(`Received unknown displayMode '${compositeDisplayMode}' for composite object '${_id}'`)
            }
            
        default:
            return null;
    }
};
