import React, { memo } from "react";

import { IsPublishedSwitch, SubobjectsIsPublishedSwitch } from "./is-publishied-switch";
import { ShowDescriptionSwitch, SubobjectShowDescriptionSwitch } from "./show-description-switch";
import { ShowDescriptionAsLinkSwitch, SubobjectShowDescriptionAsLinkSwitch } from "./show-description-as-link-switch";
import { DisplayInFeedSwitch } from "./display-in-feed-switch";
import { FeedTimestampSelector } from "./feed-timestamp-selector";
import { CompositeDisplayModeSwitch } from "./composite-display-mode-switch";
import { NumerateChaptersSwitch } from "./numerate-chapters";


/**
 * Root display tab component both for objects' and subobjects' display tabs.
 */
export const DisplayTab = memo(({ objectID, subobjectID, isSubobject = false }) => {
    const _id = isSubobject ? subobjectID : objectID;

    const showDescription = isSubobject 
        ? <SubobjectShowDescriptionSwitch objectID={objectID} subobjectID={subobjectID} />
        : <ShowDescriptionSwitch objectID={objectID} />;
    
    const showDescriptionAsLink = isSubobject
        ? <SubobjectShowDescriptionAsLinkSwitch objectID={objectID} subobjectID={subobjectID} />
        : <ShowDescriptionAsLinkSwitch objectID={objectID} />;
    
    const compositeDisplayModeSwitch = !isSubobject && <CompositeDisplayModeSwitch objectID={objectID} />;

    const numerateChaptersSwitch = !isSubobject && <NumerateChaptersSwitch objectID={objectID} />;

    return (
        <div className="objects-edit-display-tab-container">
            <IsPublishedSwitch objectID={_id} isSubobject={isSubobject} />
            <SubobjectsIsPublishedSwitch objectID={objectID} isSubobject={isSubobject} />
            <DisplayInFeedSwitch objectID={_id} />
            <FeedTimestampSelector objectID={_id} />
            {showDescription}
            {showDescriptionAsLink}
            {compositeDisplayModeSwitch}
            {numerateChaptersSwitch}
        </div>
    );
});
