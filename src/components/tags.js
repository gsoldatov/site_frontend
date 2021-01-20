import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import Layout from "./common/layout";
import Error from "./common/error";
import FieldMenu from "./field/field-menu";
import { FieldItemList, FieldItem } from "./field/field-item-list";
import FieldPagination from "./field/field-pagination";

import { REDIRECT_ON_RENDER_PATH_CREATORS, setRedirectOnRender } from "../actions/common";
import { selectTags, clearSelectedTags, pageFetch, setTagsPaginationInfo, setTagsPaginationInfoAndFetchPage,
    setShowDeleteDialogTags, toggleTagSelection, onDeleteFetch } from "../actions/tags";
import { isFetchingTags, isFetchinOrShowingDialogTags } from "../store/state-check-functions";


/* /objects page component */
export default () => {
    const dispatch = useDispatch();
    const currentPage = useSelector(state => state.tagsUI.paginationInfo.currentPage);
    const fetch = useSelector(state => state.tagsUI.fetch);

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


// Side menu items
const sideMenuItems = [
    {
        type: "item",
        text: "Add Tag",
        getIsActive: state => !isFetchinOrShowingDialogTags(state),
        onClick: setRedirectOnRender("/tags/add")
    },
    {
        type: "item",
        text: "Edit Tag",
        getIsActive: state => state.tagsUI.selectedTagIDs.length === 1 && !isFetchinOrShowingDialogTags(state),
        onClick: setRedirectOnRender(REDIRECT_ON_RENDER_PATH_CREATORS.tagsEdit)
    },
    {
        type: "item",
        text: "Delete",
        getIsActive: state => !isFetchinOrShowingDialogTags(state) && state.tagsUI.selectedTagIDs.length > 0,
        getIsVisible: state => !state.tagsUI.showDeleteDialog,
        onClick: setShowDeleteDialogTags(true)
    },
    {
        type: "dialog",
        text: "Delete Selected Tags?",
        getIsVisible: state => state.tagsUI.showDeleteDialog && !isFetchingTags(state),
        buttons: [
            {
                text: "Yes",
                onClick: onDeleteFetch()
            },
            {
                text: "No",
                onClick: setShowDeleteDialogTags(false)
            }
        ]
    }
];


// Field menu items
const fieldMenuItems = [
    {
        type: "itemGroup",
        items: [
            {
                type: "item",
                icon: "check",
                title: "Select all tags on page",
                onClick: tagIDs => selectTags(tagIDs),
                getOnClickParams: state => state.tagsUI.paginationInfo.currentPageTagIDs,
                getIsDisabled: state => isFetchingTags(state)
            },
            {
                type: "item",
                icon: "cancel",
                title: "Deselect all tags",
                onClick: clearSelectedTags(),
                getIsDisabled: state => isFetchingTags(state)
            }
        ]
    },
    {
        type: "itemGroup",
        items: [
            {
                type: "item",
                icon: "sort content descending",
                title: "Sort in ascending order",
                onClick: params => setTagsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "asc" },
                getIsDisabled: state => isFetchingTags(state),
                getIsActive: state => state.tagsUI.paginationInfo.sortOrder === "asc"
            },
            {
                type: "item",
                icon: "sort content ascending",
                title: "Sort in descending order",
                onClick: params => setTagsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "desc" },
                getIsDisabled: state => isFetchingTags(state),
                getIsActive: state => state.tagsUI.paginationInfo.sortOrder === "desc"
            }
        ]
    },
    {
        type: "itemGroup",
        // noBorder: true,
        items: [
            {
                type: "item",
                icon: "font",
                title: "Sort by tag name",
                onClick: params => setTagsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "tag_name" },
                getIsDisabled: state => isFetchingTags(state),
                getIsActive: state => state.tagsUI.paginationInfo.sortField === "tag_name"
            },
            {
                type: "item",
                icon: "clock outline",
                title: "Sort by modify time",
                onClick: params => setTagsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "modified_at" },
                getIsDisabled: state => isFetchingTags(state),
                getIsActive: state => state.tagsUI.paginationInfo.sortField === "modified_at"
            }
        ]
    },
    {
        type: "filter",
        disabledSelector: state => isFetchingTags(state),
        placeholder: "Filter tags",
        getValueSelector: state => state.tagsUI.paginationInfo.filterText,
        onChange: params => setTagsPaginationInfo(params),    // action for updating input input text (which is kept in state)
        onChangeDelayed: params => setTagsPaginationInfoAndFetchPage(params),     // action for performing a fetch with a delay from the last onChange event
        getOnChangeParams: text => ({ filterText: text })
    }
];


// Immutable selectors
const selectedTagIDsSelector = state => state.tagsUI.selectedTagIDs;
const pageTagIDsSelector = state => state.tagsUI.paginationInfo.currentPageTagIDs;
const paginationInfoSelector = state => state.tagsUI.paginationInfo;


// FieldItem creating component for /tags page
const TagsFieldItem = ({ id }) => {
    const textSelector = useRef(state => state.tags[id] ? state.tags[id].tag_name : "?").current;
    const isCheckedSelector = useRef(state => state.tagsUI.selectedTagIDs.includes(id)).current;
    const link = useRef(`/tags/${id}`).current;
    return <FieldItem id={id} textSelector={textSelector} link={link} 
    isCheckedSelector={isCheckedSelector} onChange={toggleTagSelection} />;
};
