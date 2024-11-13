import React from "react";

import { HierarchyNavigation } from "./hierarchy-navigation";
import { ObjectsViewCard } from "../../objects-view-card";
import { ChaptersDataSwitch } from "../object-data";
import { ObjectsViewSelectors } from "../../../../../store/selectors/ui/objects-view";


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

    // Get subobject's show description selector for current object
    const parentID = (hierarchyElements.parent || {}).objectID;
    const showDescriptionSelector = isNaN(parentID) ? undefined : state => ObjectsViewSelectors.showSubobjectDescription(state, parentID, objectID);
    const showDescriptionAsLinkSelector = isNaN(parentID) ? undefined : state => ObjectsViewSelectors.showSubobjectDescriptionAsLink(state, parentID, objectID);

    const attributeProps = {
        timestampProps: { displayTimestamp: false },
        headerProps: { displayViewButton: false, prefixText: numerateChapters && chapter.length > 0 ? chapter + "." : null },

        // Custom selector for subobject description display condition
        descriptionProps: { showDescriptionSelector }
    };

    const dataProps = {
        DataSwitchComponent: ChaptersDataSwitch,

        // Custom selector for link data and description merge
        showDescriptionAsLinkSelector
    };

    const tagProps = { displayTags: false };

    return <ObjectsViewCard objectID={objectID} attributeProps={attributeProps} dataProps={dataProps} tagProps={tagProps} />;
};


