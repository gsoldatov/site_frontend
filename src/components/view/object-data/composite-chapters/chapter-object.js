import React from "react";

import { HierarchyNavigation } from "./hierarchy-navigation";
import { ObjectsViewCard } from "../../objects-view-card";

/**
 * Displays data of the `hierarchyElements.current` element
 */
export const ChapterObject = ({ hierarchyElements }) => {
    return (
        <>
            <HierarchyNavigation hierarchyElements={hierarchyElements} />
            <ObjectsViewCard objectID={hierarchyElements.current.objectID} displayTimestamp={false} />
        </>
    );
};
