import React, { memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { InlineBlock, InlineItemListContainer } from "../../modules/inline/inline-item-list-containers";
import { InlineItemList } from "../../modules/inline/inline-item-list";
import { InlineItem } from "../../modules/inline/inline-item";

import { setObjectsListTagsFilterAndFetchPage } from "../../../fetches/ui/objects-list";


/**
 * /objects/list tags filter list.
 */
export const TagsFilter = () => {
    const itemIDs = useSelector(state => state.objectsListUI.paginationInfo.tagsFilter);
    if (itemIDs.length === 0) return null;

    return (
        <InlineBlock bordered>
            <InlineItemListContainer header="Tags Filter">
                <InlineItemList itemIDs={itemIDs} ItemComponent={TagsFilterItem} />
            </InlineItemListContainer>
        </InlineBlock>
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
    const icons = useMemo(() => [{ name: "remove", title: "Remove tag", onClick: () => { dispatch(setObjectsListTagsFilterAndFetchPage(id)) }}], [id]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});
