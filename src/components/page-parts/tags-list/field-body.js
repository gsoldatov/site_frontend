import React, { useEffect, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import { ErrorMessage } from "../../modules/error-message";
import { FieldItemList, FieldItem } from "../../modules/field-item-list";
import { ExpandableContainer } from "../../modules/expandable-container";
import { TagsListPagination } from "./tags-list-pagination";

import { toggleTagSelection } from "../../../reducers/ui/tags-list";
import { tagsListPageFetch } from "../../../fetches/ui/tags-list";

import { NumericUserLevel } from "../../../types/store/data/auth";


/**
 * /tags/list field body.
 */
export const TagsListFieldBody = () => {
    const dispatch = useDispatch();
    const currentPage = useSelector(state => state.tagsListUI.paginationInfo.currentPage);
    const { isFetching, fetchError } = useSelector(state => state.tagsListUI.fetch);

    // On load action
    useEffect(() => {
        dispatch(tagsListPageFetch(currentPage));
    }, []);

    if (isFetching) return <Loader active inline="centered">Loading tags...</Loader>;
    if (fetchError) return  <ErrorMessage text={fetchError}/>;

    return (
        <>
        <SelectedTags />
        <PageTags />
        <TagsListPagination />
        </>
    );
};


/**
 * Selected tags field item list.
 */
const SelectedTags = () => {
    const itemIDs = useSelector(state => state.tagsListUI.selectedTagIDs);

    return (    // 67px = header + 1 line with borders
        <ExpandableContainer maxCollapsedHeight={67}>
            <FieldItemList header="Selected Tags" itemIDs={itemIDs} ItemComponent={TagsListFieldItem} />
        </ExpandableContainer>
    );
};


/**
 * Current page tags field item list.
 */
const PageTags = () => {
    const itemIDs = useSelector(state => state.tagsListUI.paginationInfo.currentPageTagIDs);
    return <FieldItemList itemIDs={itemIDs} ItemComponent={TagsListFieldItem} />;
};


/**
 * FieldItem creating component for /tags/list page
 */
const TagsListFieldItem = memo(({ id }) => {
    const dispatch = useDispatch();
    const isLoggedInAsAdmin = useSelector(state => state.auth.numeric_user_level === NumericUserLevel.admin);

    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const URL = `/tags/view?tagIDs=${id}`;
    const onChange = useMemo(() => isLoggedInAsAdmin ? () => dispatch(toggleTagSelection(id)) : undefined, [id, isLoggedInAsAdmin]);
    const isChecked = useSelector(state => state.tagsListUI.selectedTagIDs.includes(id));
    
    return <FieldItem text={text} URL={URL} onChange={onChange} isChecked={isChecked} />;
});
