import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { InlineItem } from "../inline/inline-item";
import { InlineTextItem } from "../inline/inline-text-item";
import { InlineItemList } from "../inline/inline-item-list";
import { InlineItemListBlock, InlineItemListWrapper } from "../inline/inline-item-list-containers";


/**
 * Object view page tag list.
 */
export const ObjectsViewTagList = ({ objectID, tagProps = {} }) => {
    const tagsSelector = useMemo(() => state => state.objectsTags[objectID], [objectID]);
    const displayTags = tagProps.displayTags !== undefined ? tagProps.displayTags : true;
    const isRendered = useSelector(state => displayTags && (state.objectsTags[objectID] || []).length > 0);

    return isRendered && (
        <div className="objects-view-tag-list-container">
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
 * A single tag in the object view page.
 */
const Tag = ({ id }) => {
    const tagName = useSelector(state => state.tags[id].tag_name);
    const URL = `/tags/view?tagIDs=${id}`;

    return <InlineItem text={tagName} URL={URL} />;
};
