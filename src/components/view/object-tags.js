import React from "react";
import { useSelector } from "react-redux";

import { InlineItem } from "../inline/inline-item";
import { InlineItemListBlock, InlineItemListWrapper } from "../inline/inline-item-list-containers";


/**
 * Object view page tag list.
 */
export const ObjectTagList = ({ objectID }) => {
    const tagsSelector = useMemo(() => state => state.objectsTags[objectID], [objectID]);

    /*
    TODO custom CSS class for block and/or wrapper:
    - single line header & tag list;
    - no container borders;
    ? smaller margin/padding;
    */

    return (
        <InlineItemListBlock header="Tags">
            <InlineItemListWrapper>
                <InlineItemList itemIDSelector={tagsSelector} ItemComponent={Tag} />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    );
};


/**
 * A single tag in the object view page.
 */
const Tag = ({ tagID }) => {
    const tagName = useSelector(state => state.tags[tagID].tag_name);

    return (
        <InlineItem text={tagName} itemClassName="objects-view-tag" />
    );
};
