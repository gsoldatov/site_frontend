import React from "react";

import { HierarchyNavigation } from "./hierarchy-navigation";
import { ObjectsViewCard } from "../../objects-view-card";
import { ChaptersDataSwitch } from "../object-data";


/**
 * Displays data of the `hierarchyElements.current` element
 */
export const ChapterObject = ({ hierarchyElements }) => {
    return (
        <>
            <HierarchyNavigation hierarchyElements={hierarchyElements} />
            <ChapterObjectsViewCard objectID={hierarchyElements.current.objectID} />
        </>
    );
};

/**
 * <ObjectsViewCard> wrapper with configuration for a chapter object display.
 */
const ChapterObjectsViewCard = ({ objectID }) => {
    const attributeProps = {
        timestampProps: { displayTimestamp: false },
        headerProps: { displayViewButton: false }
    };

    const dataProps = {
        DataSwitchComponent: ChaptersDataSwitch
    };

    const tagProps = { displayTags: false };

    return <ObjectsViewCard objectID={objectID} attributeProps={attributeProps} dataProps={dataProps} tagProps={tagProps} />;
};


