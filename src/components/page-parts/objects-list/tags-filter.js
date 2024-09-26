import React, { memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { InlineItemListBlock, InlineItemListWrapper } from "../../inline/inline-item-list-containers";
import { InlineItemList } from "../../inline/inline-item-list";
import { InlineItem } from "../../inline/inline-item";

import { setTagsFilterAndFetchPage } from "../../../fetches/ui-objects-list";


/**
 * /objects/list tags filter list.
 */
export const TagsFilter = () => {
    const shouldRender = useSelector(state => state.objectsUI.paginationInfo.tagsFilter.length > 0);
    const tagsFilterItemIDSelector = useMemo(() => state => state.objectsUI.paginationInfo.tagsFilter, []);

    return shouldRender && (
        <InlineItemListBlock>
            <InlineItemListWrapper header="Tags Filter">
                <InlineItemList itemIDSelector={tagsFilterItemIDSelector} ItemComponent={TagsFilterItem} />
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
