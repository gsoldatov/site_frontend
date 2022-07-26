import React, { useEffect, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import Layout from "../common/layout";
import Error from "../common/error";
import { FieldMenu, FieldMenuButton, FieldMenuFilter, FieldMenuGroup } from "../field/field-menu";
import { FieldItemList, FieldItem } from "../field/field-item-list";
import FieldPagination from "../field/field-pagination";

import { REDIRECT_ON_RENDER_PATH_CREATORS } from "../../actions/common";
import { selectTags, clearSelectedTags, setTagsPaginationInfo, setShowDeleteDialogTags, toggleTagSelection } from "../../actions/tags-list";
import { setTagsPaginationInfoAndFetchPage, pageFetch, onDeleteFetch } from "../../fetches/ui-tags-list";
import { isFetchingTags, isFetchinOrShowingDialogTags } from "../../store/state-util/ui-tags-list";

import { enumUserLevels } from "../../util/enum-user-levels";


/**
 * /tags/list page component.
 */
export default () => {
    const dispatch = useDispatch();
    const currentPage = useSelector(state => state.tagsUI.paginationInfo.currentPage);
    const fetch = useSelector(state => state.tagsUI.fetch);
    const isLoggedIn = useSelector(state => state.auth.numeric_user_level > enumUserLevels.anonymous);

    // Side menu items
    const sideMenuItems = useMemo(() => isLoggedIn ? [
        {
            type: "linkItem",
            text: "Add a New Tag",
            icon: "add",
            iconColor: "green",
            isActiveSelector: state => !isFetchinOrShowingDialogTags(state),
            linkURL: "/tags/edit/new"
        },
        {
            type: "linkItem",
            text: "Edit Tag",
            icon: "edit outline",
            isActiveSelector: state => state.tagsUI.selectedTagIDs.length === 1 && !isFetchinOrShowingDialogTags(state),
            linkURLSelector: REDIRECT_ON_RENDER_PATH_CREATORS.tagsEdit
        },
        {
            type: "item",
            text: "Delete",
            icon: "trash alternate",
            iconColor: "red",
            isActiveSelector: state => !isFetchinOrShowingDialogTags(state) && state.tagsUI.selectedTagIDs.length > 0,
            isVisibleSelector: state => !state.tagsUI.showDeleteDialog,
            onClick: () => dispatch(setShowDeleteDialogTags(true))
        },
        {
            type: "dialog",
            text: "Delete Selected Tags?",
            isVisibleSelector: state => state.tagsUI.showDeleteDialog && !isFetchingTags(state),
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: () => dispatch(onDeleteFetch())
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowDeleteDialogTags(false))
                }
            ]
        }
    ] : []
    , [isLoggedIn]);

    // On load action
    useEffect(() => {
        dispatch(pageFetch(currentPage));
    }, []);

    const loader = fetch.isFetching && <Loader active inline="centered">Loading tags...</Loader>;
    const error = !fetch.isFetching && fetch.fetchError && <Error text={fetch.fetchError}/>;
    const pageBody = loader || error || (
        <>
        <FieldItemList header="Selected Tags" itemIDsSelector={selectedTagIDsSelector} ItemComponent={TagsFieldItem} isExpandable />
        <FieldItemList itemIDsSelector={pageTagIDsSelector} ItemComponent={TagsFieldItem} />
        <FieldPagination paginationInfoSelector={paginationInfoSelector} setCurrentPage={pageFetch} />
        </>
    );
    
    const pageBodyWithMenu = (
        <>
            <TagsFieldMenu />
            {pageBody}
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={pageBodyWithMenu} />;
};


const TagsFieldMenu = () => {
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


// Immutable selectors
const selectedTagIDsSelector = state => state.tagsUI.selectedTagIDs;
const pageTagIDsSelector = state => state.tagsUI.paginationInfo.currentPageTagIDs;
const paginationInfoSelector = state => state.tagsUI.paginationInfo;


// FieldItem creating component for /tags/list page
const TagsFieldItem = memo(({ id }) => {
    const dispatch = useDispatch();
    const isLoggedInAsAdmin = useSelector(state => state.auth.numeric_user_level === enumUserLevels.admin);

    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const URL = `/tags/view?tagIDs=${id}`;
    const onChange = useMemo(() => isLoggedInAsAdmin ? () => dispatch(toggleTagSelection(id)) : undefined, [id, isLoggedInAsAdmin]);
    const isChecked = useSelector(state => state.tagsUI.selectedTagIDs.includes(id));
    
    return <FieldItem text={text} URL={URL} onChange={onChange} isChecked={isChecked} />;
});
