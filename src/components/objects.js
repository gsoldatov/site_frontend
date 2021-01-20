import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import Layout from "./common/layout";
import Error from "./common/error";
import FieldMenu from "./field/field-menu";
import { FieldItemList, FieldItem } from "./field/field-item-list";
import FieldPagination from "./field/field-pagination";
import { InlineItemListBlock, InlineItemListWrapper } from "./inline/inline-item-list-containers";
import { InlineItemList } from "./inline/inline-item-list";
import { InlineItem } from "./inline/inline-item";
import { InlineInput } from "./inline/inline-input";

import { REDIRECT_ON_RENDER_PATH_CREATORS, setRedirectOnRender } from "../actions/common";
import { objectsOnLoadFetch, selectObjects, clearSelectedObjects, pageFetch, setObjectsPaginationInfo, setObjectsPaginationInfoAndFetchPage,
    setShowDeleteDialogObjects, toggleObjectSelection, onDeleteFetch,
    setCurrentObjectsTags, setObjectsTagsInput, objectsTagsDropdownFetch, onObjectsTagsUpdateFetch, 
    setTagsFilterAndFetchPage, tagsFilterDropdownFetch, setTagsFilterInput  } from "../actions/objects";
import { isFetchingObjects, isFetchinOrShowingDialogObjects, isObjectsTagsEditActive } from "../store/state-check-functions";
import { objectsGetCommonTagIDs, objectsGetPartiallyAppliedTagIDs, objectsGetAddedTags } from "../store/state-util";


/* /objects page component */
export default () => {
    const dispatch = useDispatch();
    const fetch = useSelector(state => state.objectsUI.fetch);

    // On load action
    useEffect(() => {
        dispatch(objectsOnLoadFetch());
    }, []);

    const loader = fetch.isFetching && <Loader active inline="centered">Loading objects...</Loader>;
    const error = !fetch.isFetching && fetch.fetchError && <Error text={fetch.fetchError}/>;
    const pageBody = loader || error || (
        <>
        <ObjectsTags />
        <FieldItemList header="Selected Objects" itemIDsSelector={selectedObjectIDsSelector} ItemComponent={ObjectsFieldItem} isExpandable />
        <FieldItemList itemIDsSelector={pageObjectIDsSelector} ItemComponent={ObjectsFieldItem} />
        <FieldPagination paginationInfoSelector={paginationInfoSelector} setCurrentPage={pageFetch} />
        </>
    );
    const pageBodyWithMenu = (
        <>
        <FieldMenu items={fieldMenuItems} />
        <TagsFilter />
        {pageBody}
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={pageBodyWithMenu} />;
};


// Side menu items
const sideMenuItems = [
    {
        type: "item",
        text: "Add Object",
        getIsActive: state => !isFetchinOrShowingDialogObjects(state),
        getIsVisible: state => !isObjectsTagsEditActive(state),
        onClick: setRedirectOnRender("/objects/add")
    },
    {
        type: "item",
        text: "Edit Object",
        getIsActive: state => state.objectsUI.selectedObjectIDs.length === 1 && !isFetchinOrShowingDialogObjects(state),
        getIsVisible: state => !isObjectsTagsEditActive(state),
        onClick: setRedirectOnRender(REDIRECT_ON_RENDER_PATH_CREATORS.objectsEdit)
    },
    {
        type: "item",
        text: "Delete",
        getIsActive: state => !isFetchinOrShowingDialogObjects(state) && state.objectsUI.selectedObjectIDs.length > 0,
        getIsVisible: state => !state.objectsUI.showDeleteDialog && !isObjectsTagsEditActive(state),
        onClick: setShowDeleteDialogObjects(true)
    },
    {
        type: "dialog",
        text: "Delete Selected Objects?",
        getIsVisible: state => state.objectsUI.showDeleteDialog && !isFetchingObjects(state),
        buttons: [
            {
                text: "Yes",
                onClick: onDeleteFetch()
            },
            {
                text: "No",
                onClick: setShowDeleteDialogObjects(false)
            }
        ]
    },

    {
        type: "item",
        text: "Update Tags",
        getIsActive: state => !isFetchingObjects(state),
        getIsVisible: state => isObjectsTagsEditActive(state),
        onClick: onObjectsTagsUpdateFetch()
    },
    {
        type: "item",
        text: "Cancel Tag Update",
        getIsActive: state => !isFetchingObjects(state),
        getIsVisible: state => isObjectsTagsEditActive(state),
        onClick: setCurrentObjectsTags({ added: [], removed: [] })
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
                title: "Select all objects on page",
                onClick: objectIDs => selectObjects(objectIDs),
                getOnClickParams: state => state.objectsUI.paginationInfo.currentPageObjectIDs,
                getIsDisabled: state => isFetchingObjects(state)
            },
            {
                type: "item",
                icon: "cancel",
                title: "Deselect all objects",
                onClick: clearSelectedObjects(),
                getIsDisabled: state => isFetchingObjects(state)
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
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "asc" },
                getIsDisabled: state => isFetchingObjects(state),
                getIsActive: state => state.objectsUI.paginationInfo.sortOrder === "asc"
            },
            {
                type: "item",
                icon: "sort content ascending",
                title: "Sort in descending order",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "desc" },
                getIsDisabled: state => isFetchingObjects(state),
                getIsActive: state => state.objectsUI.paginationInfo.sortOrder === "desc"
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
                title: "Sort by object name",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "object_name" },
                getIsDisabled: state => isFetchingObjects(state),
                getIsActive: state => state.objectsUI.paginationInfo.sortField === "object_name"
            },
            {
                type: "item",
                icon: "clock outline",
                title: "Sort by modify time",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "modified_at" },
                getIsDisabled: state => isFetchingObjects(state),
                getIsActive: state => state.objectsUI.paginationInfo.sortField === "modified_at"
            }
        ]
    },
    {
        type: "filter",
        disabledSelector: state => isFetchingObjects(state),
        placeholder: "Filter objects",
        getValueSelector: state => state.objectsUI.paginationInfo.filterText,
        onChange: params => setObjectsPaginationInfo(params),    // action for updating input input text (which is kept in state)
        onChangeDelayed: params => setObjectsPaginationInfoAndFetchPage(params),     // action for performing a fetch with a delay from the last onChange event
        getOnChangeParams: text => ({ filterText: text })
    },
    {
        type: "dropdown",
        placeholder: "Filter by object type",
        disabledSelector: state => isFetchingObjects(state),
        defaultValueSelector: state => state.objectsUI.paginationInfo.objectTypes,
        options: [
            { key: 1, text: "Links", value: "link" },
            { key: 2, text: "Markdown", value: "markdown" },
            // { key: 3, text: "To-Do Lists", value: "todo" }
        ],
        getOnChangeAction: (e, data) => setObjectsPaginationInfoAndFetchPage({ objectTypes: data.value })
    },
    // {
    //     type: "itemGroup",
    //     // noBorder: true,
        // items: [
            {
                type: "updatableDropdown",
                placeholder: "Filter objects by tags", 
                disabledSelector: state => isFetchingObjects(state), 
                inputStateSelector: state => state.objectsUI.tagsFilterInput, 
                existingIDsSelector: state => state.objectsUI.paginationInfo.tagsFilter,
                onSearchChange: setTagsFilterInput,
                onSearchChangeDelayed: tagsFilterDropdownFetch,
                onChange: setTagsFilterAndFetchPage,
                getDropdownItemTextSelectors: { itemStoreSelector: state => state.tags, itemTextSelector: (store, id) => store[id].tag_name }
            },
            {
                type: "item",
                icon: "remove",
                title: "Clear tags filter",
                onClick: params => setTagsFilterAndFetchPage(),
                // onClickParams: { sortField: "object_name" },
                getIsDisabled: state => isFetchingObjects(state) || state.objectsUI.paginationInfo.tagsFilter.length == 0,
                // getIsActive: state => state.objectsUI.paginationInfo.sortField === "object_name"
            }
        // ]
    // }
];


// Immutable selectors
const selectedObjectIDsSelector = state => state.objectsUI.selectedObjectIDs;
const pageObjectIDsSelector = state => state.objectsUI.paginationInfo.currentPageObjectIDs;
const paginationInfoSelector = state => state.objectsUI.paginationInfo;


// FieldItem creating component for /objects page
const ObjectsFieldItem = ({ id }) => {
    const textSelector = useRef(state => state.objects[id] ? state.objects[id].object_name : "?").current;
    const isCheckedSelector = useRef(state => state.objectsUI.selectedObjectIDs.includes(id)).current;
    const link = useRef(`/objects/${id}`).current;
    return <FieldItem id={id} textSelector={textSelector} link={link} 
    isCheckedSelector={isCheckedSelector} onChange={toggleObjectSelection} />;
};


// Tags filter
const TagsFilterItem = ({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    // const isRemoved = useSelector(state => state.objectsUI.removedTagIDs.includes(id));
    // const itemClassName = isRemoved ? "inline-item-red" : "inline-item";
    const itemClassName = "inline-item-orange";
    const onClick = () => dispatch(setTagsFilterAndFetchPage(id));
    const itemLink = `/tags/${id}`;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
};
const tagsFilterIsDisplayedSelector = state => state.objectsUI.paginationInfo.tagsFilter.length > 0;
const tagsFilterItemIDSelector = state => state.objectsUI.paginationInfo.tagsFilter;
const TagsFilter = () => {
    const shouldRender = useSelector(tagsFilterIsDisplayedSelector);
    return shouldRender && (
        <InlineItemListBlock>
            <InlineItemListWrapper header="Tags Filter">
                <InlineItemList itemIDSelector={tagsFilterItemIDSelector} ItemComponent={TagsFilterItem} />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    )
}


// Objects tags
const CommonCurrentTagItem = ({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const isRemoved = useSelector(state => state.objectsUI.removedTagIDs.includes(id));
    const itemClassName = isRemoved ? "inline-item-red" : "inline-item";
    const onClick = () => dispatch(setCurrentObjectsTags({ removed: [id] }));
    const itemLink = `/tags/${id}`;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
};
const AddedTagItem = ({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => typeof(id) === "string" ? id : state.tags[id] ? state.tags[id].tag_name : id);
    const itemClassName = typeof(id) === "number" ? "inline-item-green" : "inline-item-blue";
    const onClick = () => dispatch(setCurrentObjectsTags({ added: [id] }));
    const itemLink = typeof(id) === "number" ? `/tags/${id}` : undefined;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
};
const PartiallyAppliedTagItem = ({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => typeof(id) === "string" ? id : state.tags[id] ? state.tags[id].tag_name : id);
    const isAdded = useSelector(state => state.objectsUI.addedTags.includes(id));
    const isRemoved = useSelector(state => state.objectsUI.removedTagIDs.includes(id));
    const itemClassName = isAdded ? "inline-item-green" : isRemoved ? "inline-item-red" : "inline-item";
    const onClick = isAdded ? () => dispatch(setCurrentObjectsTags({ added: [id], removed: [id] })) :   // current => added => removed => current
                    isRemoved ? () => dispatch(setCurrentObjectsTags({ removed: [id] })) : 
                    () => dispatch(setCurrentObjectsTags({ added: [id] }));
    const itemLink = typeof(id) === "number" ? `/tags/${id}` : undefined;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
};

const inputStateSelector = state => state.objectsUI.tagsInput;
const existingIDsSelector = state => objectsGetCommonTagIDs(state).concat(objectsGetPartiallyAppliedTagIDs(state)).concat(
    state.objectsUI.addedTags.filter(tag => typeof(tag) === "number")); // common + partially applied + added existing tags
const getItemTextSelector = id => state => state.tags[id] ? state.tags[id].tag_name : id;

const commonTagsWrapperIsDisplayedSelector = state => state.objectsUI.selectedObjectIDs.length > 0;
const partiallyAppliedTagsWrapperIsDisplayedSelector = state => objectsGetPartiallyAppliedTagIDs(state).length > 0;

const ObjectsTags = () => {
    // const renderBlock = useSelector(commonTagsWrapperIsDisplayedSelector) || useSelector(partiallyAppliedTagsWrapperIsDisplayedSelector);
    const shouldRenderCommonTags = useSelector(commonTagsWrapperIsDisplayedSelector);
    const shouldRenderPartiallyAppliedTags = useSelector(partiallyAppliedTagsWrapperIsDisplayedSelector)

    return (shouldRenderCommonTags || shouldRenderPartiallyAppliedTags) && (
        <InlineItemListBlock>
            <InlineItemListWrapper header="Common Tags" isDisplayedSelector={commonTagsWrapperIsDisplayedSelector}>
                <InlineItemList itemIDSelector={objectsGetCommonTagIDs} ItemComponent={CommonCurrentTagItem} />
                <InlineItemList itemIDSelector={objectsGetAddedTags} ItemComponent={AddedTagItem} />
                <InlineInput inputStateSelector={inputStateSelector} setInputState={setObjectsTagsInput} inputPlaceholder="Enter tag name..." onChangeDelayed={objectsTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} getItemTextSelector={getItemTextSelector} setItem={setCurrentObjectsTags} />
            </InlineItemListWrapper>

            <InlineItemListWrapper header="Partially Applied Tags" isDisplayedSelector={partiallyAppliedTagsWrapperIsDisplayedSelector}>
                <InlineItemList itemIDSelector={objectsGetPartiallyAppliedTagIDs} ItemComponent={PartiallyAppliedTagItem} />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    )
};
