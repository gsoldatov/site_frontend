import React from "react";
import { useSelector } from "react-redux";

import { FeedCard, FeedCardTimestamp, FeedCardHeader, FeedCardDescription } from "../../modules/feed/feed-card";

import { InlineItemListContainer } from "../../modules/inline/inline-item-list-containers";
import { InlineItemList } from "../../modules/inline/inline-item-list";
import { InlineTextItem } from "../../modules/inline/inline-text-item";
import { InlineItem } from "../../modules/inline/inline-item";

import { enumObjectTypes } from "../../../util/enums/enum-object-types";


/**
 * Object feed card component.
 */
export const ObjectFeedCard = ({ objectID }) => {
    const timestamp = useSelector(state => {
        const object = state.objects[objectID] || {};
        return object.feed_timestamp || object.modified_at;
    });

    const objectName = useSelector(state => (state.objects[objectID] || {}).object_name);
    const URL = `/objects/view/${objectID}`;
    const objectDescription = useSelector(state => {
        if (!state.objects[objectID] || !state.objects[objectID].show_description) return undefined;
        return state.objects[objectID].object_description;
    });
    
    const objectType = useSelector(state => (state.objects[objectID] || {}).object_type);
    const headerIcon = (enumObjectTypes[objectType] || {}).icon;
    const headerIconTitle = (enumObjectTypes[objectType] || {}).name;

    return (
        <FeedCard>
            <FeedCardTimestamp timestamp={timestamp} />
            <FeedCardHeader text={objectName} URL={URL} icon={headerIcon} iconTitle={headerIconTitle} />
            <FeedCardDescription text={objectDescription} />
            <ObjectPreviewTagList objectID={objectID} />
        </FeedCard>
    );
};


/**
 * Object feed card tag list.
 */
const ObjectPreviewTagList = ({ objectID }) => {
    const tagIDs = useSelector(state => state.objectsTags[objectID] || []);

    if (tagIDs.length === 0) return null;

    return (
        <div className="object-feed-card-tag-list-container">
            <InlineItemListContainer>
                <InlineTextItem text="Tags:" />
                <InlineItemList itemIDs={tagIDs} ItemComponent={Tag} />
            </InlineItemListContainer>
        </div>
    );
};


/**
 * A single tag in the object preview.
 */
const Tag = ({ id }) => {
    const tagName = useSelector(state => (state.tags[id] || {}).tag_name);
    if (tagName === undefined) return null;

    const URL = `/tags/view?tagIDs=${id}`;

    return <InlineItem text={tagName} URL={URL} />;
};
