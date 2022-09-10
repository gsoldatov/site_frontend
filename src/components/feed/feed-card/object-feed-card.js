import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { FeedCard, FeedCardTimestamp, FeedCardHeader, FeedCardDescription } from "./feed-card";

import { InlineItemListBlock, InlineItemListWrapper } from "../../inline/inline-item-list-containers";
import { InlineItemList } from "../../inline/inline-item-list";
import { InlineTextItem } from "../../inline/inline-text-item";
import { InlineItem } from "../../inline/inline-item";

import { enumObjectTypes } from "../../../util/enum-object-types";


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
    const tagsSelector = useMemo(() => state => state.objectsTags[objectID], [objectID]);
    const showTagList = useSelector(state => (state.objectsTags[objectID] || []).length > 0);

    return showTagList && (
        <div className="object-feed-card-tag-list-container">
            <InlineItemListBlock className="borderless">
                <InlineItemListWrapper>
                    <InlineTextItem text="Tags:" />
                    <InlineItemList itemIDSelector={tagsSelector} ItemComponent={Tag} />
                </InlineItemListWrapper>
            </InlineItemListBlock>
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
