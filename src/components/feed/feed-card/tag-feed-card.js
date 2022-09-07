import React from "react";
import { useSelector } from "react-redux";

import { FeedCard, FeedCardTimestamp, FeedCardHeader, FeedCardDescription } from "./feed-card";


/**
 * Tag feed card component.
 */
export const TagFeedCard = ({ tagID }) => {
    const timestamp = useSelector(state => (state.tags[tagID] || {}).modified_at);

    const tagName = useSelector(state => (state.tags[tagID] || {}).tag_name);
    const URL = `/tags/view?tagIDs=${tagID}`;
    const tagDescription = useSelector(state => (state.tags[tagID] || {}).tag_description);

    return (
        <FeedCard>
            <FeedCardTimestamp timestamp={timestamp} />
            <FeedCardHeader text={tagName} URL={URL} icon="tag" iconTitle="Tag" />
            <FeedCardDescription text={tagDescription} />
        </FeedCard>
    );
};
