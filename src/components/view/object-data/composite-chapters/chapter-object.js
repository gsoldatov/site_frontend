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
            <ChapterObjectsViewCard hierarchyElements={hierarchyElements} />
        </>
    );
};

/**
 * <ObjectsViewCard> wrapper with configuration for a chapter object display.
 */
const ChapterObjectsViewCard = ({ hierarchyElements }) => {
    const { objectID, chapter } = (hierarchyElements.current || {});
    const { numerateChapters } = (hierarchyElements.root || {});

    const attributeProps = {
        timestampProps: { displayTimestamp: false },
        headerProps: { displayViewButton: false, prefixText: numerateChapters && chapter.length > 0 ? chapter + "." : null }
    };

    const dataProps = {
        DataSwitchComponent: ChaptersDataSwitch
    };

    const tagProps = { displayTags: false };

    return <ObjectsViewCard objectID={objectID} attributeProps={attributeProps} dataProps={dataProps} tagProps={tagProps} />;
};


