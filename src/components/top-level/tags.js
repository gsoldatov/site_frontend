import React, { useEffect, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import Layout from "../common/layout";
import Error from "../common/error";
import FieldMenu from "../field/field-menu";
import { FieldItemList, FieldItem } from "../field/field-item-list";
import FieldPagination from "../field/field-pagination";

import { REDIRECT_ON_RENDER_PATH_CREATORS } from "../../actions/common";
import { selectTags, clearSelectedTags, setTagsPaginationInfo, setShowDeleteDialogTags, toggleTagSelection } from "../../actions/tags";
import { setTagsPaginationInfoAndFetchPage, pageFetch, onDeleteFetch } from "../../fetches/ui-tags";
import { isFetchingTags, isFetchinOrShowingDialogTags } from "../../store/state-util/ui-tags";


/**
 * /tags page component.
 */
export default () => {
    const dispatch = useDispatch();
    const currentPage = useSelector(state => state.tagsUI.paginationInfo.currentPage);
    const fetch = useSelector(state => state.tagsUI.fetch);

    // Side menu items
    const sideMenuItems = useMemo(() => [
        {
            type: "linkItem",
            text: "Add a New Tag",
            icon: "add",
            iconColor: "green",
            isActiveSelector: state => !isFetchinOrShowingDialogTags(state),
            linkURL: "/tags/add"
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
    ]);

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
        <FieldMenu items={fieldMenuItems} />
        {pageBody}
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={pageBodyWithMenu} />;
};


// Field menu items
const fieldMenuItems = [
    {
        type: "group",
        items: [
            {
                type: "item",
                icon: "check",
                title: "Select all tags on page",
                onClick: tagIDs => selectTags(tagIDs),
                onClickParamsSelector: state => state.tagsUI.paginationInfo.currentPageTagIDs,
                isDisabledSelector: state => isFetchingTags(state)
            },
            {
                type: "item",
                icon: "cancel",
                title: "Deselect all tags",
                onClick: clearSelectedTags(),
                isDisabledSelector: state => isFetchingTags(state)
            },

            {
                type: "separator"
            },
            {
                type: "item",
                icon: "sort content descending",
                title: "Sort in ascending order",
                onClick: params => setTagsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "asc" },
                isDisabledSelector: state => isFetchingTags(state),
                isActiveSelector: state => state.tagsUI.paginationInfo.sortOrder === "asc"
            },
            {
                type: "item",
                icon: "sort content ascending",
                title: "Sort in descending order",
                onClick: params => setTagsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "desc" },
                isDisabledSelector: state => isFetchingTags(state),
                isActiveSelector: state => state.tagsUI.paginationInfo.sortOrder === "desc"
            },
            
            {
                type: "separator"
            },
            {
                type: "item",
                icon: "font",
                title: "Sort by tag name",
                onClick: params => setTagsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "tag_name" },
                isDisabledSelector: state => isFetchingTags(state),
                isActiveSelector: state => state.tagsUI.paginationInfo.sortField === "tag_name"
            },
            {
                type: "item",
                icon: "clock outline",
                title: "Sort by modify time",
                onClick: params => setTagsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "modified_at" },
                isDisabledSelector: state => isFetchingTags(state),
                isActiveSelector: state => state.tagsUI.paginationInfo.sortField === "modified_at"
            },

            {
                type: "separator",
                hideWhenNotFullscreen: true
            }
        ]
    },
    {
        type: "group",
        items: [
            {
                type: "filter",
                isDisabledSelector: state => isFetchingTags(state),
                placeholder: "Filter tags",
                valueSelector: state => state.tagsUI.paginationInfo.filterText,
                onChange: params => setTagsPaginationInfo(params),    // action for updating input input text (which is kept in state)
                onChangeDelayed: params => setTagsPaginationInfoAndFetchPage(params),     // action for performing a fetch with a delay from the last onChange event
                getOnChangeParams: text => ({ filterText: text })
            }
        ]
    }
];


// Immutable selectors
const selectedTagIDsSelector = state => state.tagsUI.selectedTagIDs;
const pageTagIDsSelector = state => state.tagsUI.paginationInfo.currentPageTagIDs;
const paginationInfoSelector = state => state.tagsUI.paginationInfo;


// FieldItem creating component for /tags page
const TagsFieldItem = memo(({ id }) => {
    const textSelector = useMemo(() => state => state.tags[id] ? state.tags[id].tag_name : "?", [id]);
    const isCheckedSelector = useMemo(() => state => state.tagsUI.selectedTagIDs.includes(id), [id]);
    const link = useMemo(() => `/tags/${id}`, [id]);
    return <FieldItem id={id} textSelector={textSelector} link={link} 
    isCheckedSelector={isCheckedSelector} onChange={toggleTagSelection} />;
});