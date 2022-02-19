import React from "react";
import { useSelector } from "react-redux";

import { Link_ } from "./link";
import { Markdown } from "./markdown";
import { ToDoList } from "./to-do-list";
import { CompositePlaceholder } from "./composite-placeholder";
import { CompositeBasic } from "./composite-basic";
import { CompositeGroupedLinks } from "./composite-grouped-links";
import { CompositeMulticolumn } from "./composite-multicolumn";
import { CompositeChapters } from "./composite-chapters/composite-chapters";

import { enumCompositeObjectDisplayModes } from "../../../util/enum-composite-object-display-modes";
import { objectDataIsInState } from "../../../store/state-util/objects";


/**
 * Displays object data in <ObjectsViewCard> of an object with the provided `objectID`.
 * If `dataProps.DataSwitchComponent` is provided, renders it. Otherwise uses <DefaultObjectDataSwitch> component, which is used for rendering root object's data on the /objects/view/:id page.
 */
export const ObjectData = ({ objectID, dataProps = {} }) => {
    const DataSwitchComponent = dataProps.DataSwitchComponent || DefaultObjectDataSwitch;
    return <DataSwitchComponent objectID={objectID} dataProps={dataProps} />;
};


/**
 * Default data switch component for rendering data of the root object.
 */
const DefaultObjectDataSwitch = ({ objectID, dataProps = {} }) => {
    const isRendered = useSelector(state => objectDataIsInState(state, objectID));
    const objectType = useSelector(state => (state.objects[objectID] || {}).object_type);
    const compositeDisplayMode = useSelector(state => (state.composite[objectID] || {}).display_mode);

    // Don't render if object attributes are not present in the local state (to avoid errors after logout)
    if (!isRendered) return null;

    switch (objectType) {
        case "link":
            return <Link_ objectID={objectID} dataProps={dataProps} />;
        case "markdown":
            return <Markdown objectID={objectID} />;
        case "to_do_list":
            return <ToDoList objectID={objectID} />;
        case "composite":
            switch (compositeDisplayMode) {
                case enumCompositeObjectDisplayModes.basic.value:
                    return <CompositeBasic objectID={objectID} />;
                case enumCompositeObjectDisplayModes.groupedLinks.value:
                    return <CompositeGroupedLinks objectID={objectID} />;
                case enumCompositeObjectDisplayModes.multicolumn.value:
                    return <CompositeMulticolumn objectID={objectID} />;
                case enumCompositeObjectDisplayModes.chapters.value:
                    return <CompositeChapters objectID={objectID} />;
                default:
                    throw Error(`Received unknown displayMode '${compositeDisplayMode}' for composite object '${objectID}'`)
            }
            
        default:
            throw Error(`Received unknown objectType '${objectType}' for object '${objectID}'`)
    }
};


/**
 * Data switch component which does not recursively render composite subobjects' data.
 */
export const SubobjectDataSwitch = ({ objectID, dataProps = {} }) => {
    const isRendered = useSelector(state => objectDataIsInState(state, objectID));
    const objectType = useSelector(state => (state.objects[objectID] || {}).object_type);

    // Don't render if object attributes are not present in the local state (to avoid errors after logout)
    if (!isRendered) return null;

    switch (objectType) {
        case "link":
            return <Link_ objectID={objectID} dataProps={dataProps} />;
        case "markdown":
            return <Markdown objectID={objectID} />;
        case "to_do_list":
            return <ToDoList objectID={objectID} />;
        case "composite":
            return <CompositePlaceholder objectID={objectID} />;            
        default:
            throw Error(`Received unknown objectType '${objectType}' for object '${objectID}'`)
    }
};
