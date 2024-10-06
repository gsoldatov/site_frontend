import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { InlineItem } from "../../modules/inline/inline-item";
import { InlineTextItem } from "../../modules/inline/inline-text-item";
import { InlineItemList } from "../../modules/inline/inline-item-list";
import { InlineItemListBlock, InlineItemListWrapper } from "../../modules/inline/inline-item-list-containers";


/**
 * Object view page tag list.
 */
export const ObjectsViewTagList = ({ objectID, tagProps = { displayTags: true } }) => {
    const tagIDs = useSelector(state => state.objectsTags[objectID] || []);

    if (!tagProps.displayTags || tagIDs.length === 0) return null;

    return (
        <div className="objects-view-tag-list-container">
            <InlineItemListBlock className="borderless">
                <InlineItemListWrapper>
                    <InlineTextItem text="Tags:" />
                    <InlineItemList itemIDs={tagIDs} ItemComponent={Tag} />
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
