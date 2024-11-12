import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { HorizontalMenu, HorizontalMenuButton, HorizontalMenuFilter, HorizontalMenuGroup } from "../../modules/horizontal-menu";

import { selectTags, clearSelectedTags, setTagsListPaginationInfo } from "../../../reducers/ui/tags-list";
import { setTagsListPaginationInfoAndFetchPage } from "../../../fetches/ui/tags-list";
import { TagsListSelectors } from "../../../store/selectors/ui/tags-list";

import { NumericUserLevel } from "../../../store/types/data/auth";


/**
 * /tags/list field menu
 */
export const TagsListHorizontalMenu = () => {
    const dispatch = useDispatch();

    // Common props
    const isLoggedInAsAdmin = useSelector(state => state.auth.numeric_user_level === NumericUserLevel.admin);
    const isDisabled = useSelector(TagsListSelectors.isFetching);
    
    // Select all tags button
    const currentPageTagIDs = useSelector(state => state.tagsListUI.paginationInfo.currentPageTagIDs);
    const selectAllOnClick = useMemo(() => () => dispatch(selectTags(currentPageTagIDs)), [currentPageTagIDs]);
    const selectAllButton = isLoggedInAsAdmin && 
        <HorizontalMenuButton icon="check" title="Select all tags on page" onClick={selectAllOnClick} isDisabled={isDisabled} />;

    // Deselect all tags button
    const deselectAllOnClick = useMemo(() => () => dispatch(clearSelectedTags()), []);
    const deselectAllButton = isLoggedInAsAdmin && 
        <HorizontalMenuButton icon="cancel" title="Deselect all tags" onClick={deselectAllOnClick} isDisabled={isDisabled} />

    // Sort asc button
    const sortAscOnClick = useMemo(() => () => dispatch(setTagsListPaginationInfoAndFetchPage({ sortOrder: "asc" })), []);
    const sortAscIsActive = useSelector(state => state.tagsListUI.paginationInfo.sortOrder === "asc");

    // Sort desc button
    const sortDescOnClick = useMemo(() => () => dispatch(setTagsListPaginationInfoAndFetchPage({ sortOrder: "desc" })), []);
    const sortDescIsActive = useSelector(state => state.tagsListUI.paginationInfo.sortOrder === "desc");

    // Sort by name button
    const sortByNameOnClick = useMemo(() => () => dispatch(setTagsListPaginationInfoAndFetchPage({ sortField: "tag_name" })), []);
    const sortByNameIsActive = useSelector(state => state.tagsListUI.paginationInfo.sortField === "tag_name");

    // Sort by modify time button
    const sortByModifyTimeOnClick = useMemo(() => () => dispatch(setTagsListPaginationInfoAndFetchPage({ sortField: "modified_at" })), []);
    const sortByModifyTimeIsActive = useSelector(state => state.tagsListUI.paginationInfo.sortField === "modified_at");

    // Tag name filter
    const tagNameFilterValue = useSelector(state => state.tagsListUI.paginationInfo.filterText);
    const tagNameFilterOnChange = useMemo(() => value => dispatch(setTagsListPaginationInfo({ filterText: value })), []);
    const tagNameFilterOnChangeDelayed = useMemo(() => value => dispatch(setTagsListPaginationInfoAndFetchPage({ filterText: value })), []);

    return (
        <HorizontalMenu>
            <HorizontalMenuGroup isButtonGroup>
                {selectAllButton}
                {deselectAllButton}
                <HorizontalMenuButton icon="sort content descending" title="Sort in ascending order" onClick={sortAscOnClick} 
                    isDisabled={isDisabled} isActive={sortAscIsActive} />
                <HorizontalMenuButton icon="sort content ascending" title="Sort in descending order" onClick={sortDescOnClick} 
                    isDisabled={isDisabled} isActive={sortDescIsActive} />
                <HorizontalMenuButton icon="font" title="Sort by tag name" onClick={sortByNameOnClick} 
                    isDisabled={isDisabled} isActive={sortByNameIsActive} />
                <HorizontalMenuButton icon="clock outline" title="Sort by modify time" onClick={sortByModifyTimeOnClick} 
                    isDisabled={isDisabled} isActive={sortByModifyTimeIsActive} />
            </HorizontalMenuGroup>
            
            <HorizontalMenuGroup>
                <HorizontalMenuFilter value={tagNameFilterValue} placeholder="Filter tags"
                    onChange={tagNameFilterOnChange} onChangeDelayed={tagNameFilterOnChangeDelayed} />
            </HorizontalMenuGroup>
        </HorizontalMenu>
    );
};
