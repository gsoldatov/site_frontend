import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { FieldMenu, FieldMenuButton, FieldMenuFilter, FieldMenuGroup } from "../../field/field-menu";

import { selectTags, clearSelectedTags, setTagsPaginationInfo } from "../../../actions/tags-list";
import { setTagsPaginationInfoAndFetchPage } from "../../../fetches/ui-tags-list";
import { isFetchingTags } from "../../../store/state-util/ui-tags-list";

import { enumUserLevels } from "../../../util/enum-user-levels";


/**
 * /tags/list field menu
 */
export const TagsListFieldMenu = () => {
    const dispatch = useDispatch();

    // Common props
    const isLoggedInAsAdmin = useSelector(state => state.auth.numeric_user_level === enumUserLevels.admin);
    const isDisabled = useSelector(state => isFetchingTags(state));
    
    // Select all tags button
    const currentPageTagIDs = useSelector(state => state.tagsUI.paginationInfo.currentPageTagIDs);
    const selectAllOnClick = useMemo(() => () => dispatch(selectTags(currentPageTagIDs)), [currentPageTagIDs]);
    const selectAllButton = isLoggedInAsAdmin && <FieldMenuButton icon="check" title="Select all tags on page" onClick={selectAllOnClick} isDisabled={isDisabled} />;

    // Deselect all tags button
    const deselectAllOnClick = useMemo(() => () => dispatch(clearSelectedTags()), []);
    const deselectAllButton = isLoggedInAsAdmin && <FieldMenuButton icon="cancel" title="Deselect all tags" onClick={deselectAllOnClick} isDisabled={isDisabled} />

    // Sort asc button
    const sortAscOnClick = useMemo(() => () => dispatch(setTagsPaginationInfoAndFetchPage({ sortOrder: "asc" })), []);
    const sortAscIsActive = useSelector(state => state.tagsUI.paginationInfo.sortOrder === "asc");

    // Sort desc button
    const sortDescOnClick = useMemo(() => () => dispatch(setTagsPaginationInfoAndFetchPage({ sortOrder: "desc" })), []);
    const sortDescIsActive = useSelector(state => state.tagsUI.paginationInfo.sortOrder === "desc");

    // Sort by name button
    const sortByNameOnClick = useMemo(() => () => dispatch(setTagsPaginationInfoAndFetchPage({ sortField: "tag_name" })), []);
    const sortByNameIsActive = useSelector(state => state.tagsUI.paginationInfo.sortField === "tag_name");

    // Sort by modify time button
    const sortByModifyTimeOnClick = useMemo(() => () => dispatch(setTagsPaginationInfoAndFetchPage({ sortField: "modified_at" })), []);
    const sortByModifyTimeIsActive = useSelector(state => state.tagsUI.paginationInfo.sortField === "modified_at");

    // Tag name filter
    const tagNameFilterValue = useSelector(state => state.tagsUI.paginationInfo.filterText);
    const tagNameFilterOnChange = useMemo(() => value => dispatch(setTagsPaginationInfo({ filterText: value })), []);
    const tagNameFilterOnChangeDelayed = useMemo(() => value => dispatch(setTagsPaginationInfoAndFetchPage({ filterText: value })), []);

    return (
        <FieldMenu>
            <FieldMenuGroup isButtonGroup>
                {selectAllButton}
                {deselectAllButton}
                <FieldMenuButton icon="sort content descending" title="Sort in ascending order" onClick={sortAscOnClick} 
                    isDisabled={isDisabled} isActive={sortAscIsActive} />
                <FieldMenuButton icon="sort content ascending" title="Sort in descending order" onClick={sortDescOnClick} 
                    isDisabled={isDisabled} isActive={sortDescIsActive} />
                <FieldMenuButton icon="font" title="Sort by tag name" onClick={sortByNameOnClick} 
                    isDisabled={isDisabled} isActive={sortByNameIsActive} />
                <FieldMenuButton icon="clock outline" title="Sort by modify time" onClick={sortByModifyTimeOnClick} 
                    isDisabled={isDisabled} isActive={sortByModifyTimeIsActive} />
            </FieldMenuGroup>
            
            <FieldMenuGroup>
                <FieldMenuFilter value={tagNameFilterValue} placeholder="Filter tags" isDisabled={isDisabled}
                    onChange={tagNameFilterOnChange} onChangeDelayed={tagNameFilterOnChangeDelayed} />
            </FieldMenuGroup>
        </FieldMenu>
    );
};
