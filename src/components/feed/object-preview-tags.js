import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { InlineItem } from  "../inline/inline-item";
import { InlineItemList } from "../inline/inline-item-list";
import { InlineItemListBlock, InlineItemListWrapper } from "../inline/inline-item-list-containers";
import { InlineTextItem } from "../inline/inline-text-item";


/**
 * Object preview tag list.
 */
export const ObjectPreviewTagList = ({ objectID }) => {
    const tagsSelector = useMemo(() => state => state.objectsTags[objectID], [objectID]);
    const showTagList = useSelector(state => (state.objectsTags[objectID] || []).length > 0);

    return showTagList && (
        <div className="object-preview-tag-list-container">
            <InlineItemListBlock borderless>
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
    const tagName = useSelector(state => state.tags[id].tag_name);

    return (
        <InlineItem text={tagName} itemClassName="inline-item" />
    );
};
