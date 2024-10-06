import React, { memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { InlineItemListBlock, InlineItemListWrapper } from "../../modules/inline/inline-item-list-containers";
import { InlineItemList } from "../../modules/inline/inline-item-list";
import { InlineItem } from "../../modules/inline/inline-item";

import { setTagsFilterAndFetchPage } from "../../../fetches/ui-objects-list";


/**
 * /objects/list tags filter list.
 */
export const TagsFilter = () => {
    const itemIDs = useSelector(state => state.objectsUI.paginationInfo.tagsFilter);
    if (itemIDs.length === 0) return null;

    return (
        <InlineItemListBlock>
            <InlineItemListWrapper header="Tags Filter">
                <InlineItemList itemIDs={itemIDs} ItemComponent={TagsFilterItem} />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    )
};


/**
 * /objects/list tags filter item.
 */
const TagsFilterItem = memo(({ id }) => {
    const dispatch = useDispatch();
    
    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const className = "filter";
    const URL = `/tags/view?tagIDs=${id}`;
    const icons = useMemo(() => [{ name: "remove", title: "Remove tag", onClick: () => { dispatch(setTagsFilterAndFetchPage(id)) }}], [id]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});
