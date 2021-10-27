import React, { memo, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import Layout from "../common/layout";
import Error from "../common/error";
import FieldMenu from "../field/field-menu";
import { FieldItemList, FieldItem } from "../field/field-item-list";
import FieldPagination from "../field/field-pagination";
import { InlineItemListBlock, InlineItemListWrapper } from "../inline/inline-item-list-containers";
import { InlineItemList } from "../inline/inline-item-list";
import { InlineItem } from "../inline/inline-item";
import { InlineInput } from "../inline/inline-input";

import { REDIRECT_ON_RENDER_PATH_CREATORS } from "../../actions/common";
import { selectObjects, clearSelectedObjects, setObjectsPaginationInfo,
        setShowDeleteDialogObjects, toggleObjectSelection, setCurrentObjectsTags, setObjectsTagsInput, setTagsFilterInput  } from "../../actions/objects-list";
import { objectsOnLoadFetch, pageFetch, setObjectsPaginationInfoAndFetchPage, onDeleteFetch, objectsTagsDropdownFetch, onObjectsTagsUpdateFetch, 
        setTagsFilterAndFetchPage, tagsFilterDropdownFetch, } from "../../fetches/ui-objects";
import { isFetchingObjects, isFetchingOrShowingDeleteDialogObjects, isObjectsTagsEditActive,
    commonTagIDsSelector, partiallyAppliedTagIDsSelector, existingIDsSelector, addedTagsSelector } from "../../store/state-util/ui-objects-list";
import { enumObjectTypes } from "../../util/enum-object-types";


/**
 * /objects page component.
 */
export default () => {
    const dispatch = useDispatch();
    const fetch = useSelector(state => state.objectsUI.fetch);

    // Side menu items
    const sideMenuItems = useMemo(() => [
        {
            type: "linkItem",
            text: "Add a New Object",
            icon: "add",
            iconColor: "green",
            isActiveSelector: state => !isFetchingOrShowingDeleteDialogObjects(state),
            isVisibleSelector: state => !isObjectsTagsEditActive(state),
            linkURL: "/objects/edit/new"
        },
        {
            type: "linkItem",
            text: "Edit Object",
            icon: "edit outline",
            isActiveSelector: state => state.objectsUI.selectedObjectIDs.length === 1 && !isFetchingOrShowingDeleteDialogObjects(state),
            isVisibleSelector: state => !isObjectsTagsEditActive(state),
            linkURLSelector: REDIRECT_ON_RENDER_PATH_CREATORS.objectsEdit
        },
        {
            type: "item",
            text: "Delete",
            icon: "trash alternate",
            iconColor: "red",
            isActiveSelector: state => !isFetchingOrShowingDeleteDialogObjects(state) && state.objectsUI.selectedObjectIDs.length > 0,
            isVisibleSelector: state => !state.objectsUI.showDeleteDialog && !isObjectsTagsEditActive(state),
            onClick: () => dispatch(setShowDeleteDialogObjects(true))
        },
        {
            type: "dialog",
            text: "Delete Selected Objects?",
            isVisibleSelector: state => state.objectsUI.showDeleteDialog && !isFetchingObjects(state),
            isCheckboxDisplayedSelector: state => {
                for (let objectID of state.objectsUI.selectedObjectIDs)
                    if (state.objects[objectID].object_type === "composite") return true;
                return false;
            },
            checkboxText: "Delete subobjects",
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: deleteSubobjects => dispatch(onDeleteFetch(deleteSubobjects))
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowDeleteDialogObjects(false))
                }
            ]
        },

        {
            type: "item",
            text: "Update Tags",
            icon: "check",
            iconColor: "green",
            isActiveSelector: state => !isFetchingObjects(state),
            isVisibleSelector: state => isObjectsTagsEditActive(state),
            onClick: () => dispatch(onObjectsTagsUpdateFetch())
        },
        {
            type: "item",
            text: "Cancel Tag Update",
            icon: "cancel",
            iconColor: "red",
            isActiveSelector: state => !isFetchingObjects(state),
            isVisibleSelector: state => isObjectsTagsEditActive(state),
            onClick: () => dispatch(setCurrentObjectsTags({ added: [], removed: [] }))
        }
    ]);

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


// Field menu items
const fieldMenuItems = [
    {
        type: "group",
        items: [
            {
                type: "item",
                icon: "check",
                title: "Select all objects on page",
                onClick: objectIDs => selectObjects(objectIDs),
                onClickParamsSelector: state => state.objectsUI.paginationInfo.currentPageObjectIDs,
                isDisabledSelector: state => isFetchingObjects(state)
            },
            {
                type: "item",
                icon: "cancel",
                title: "Deselect all objects",
                onClick: clearSelectedObjects(),
                isDisabledSelector: state => isFetchingObjects(state)
            },
            
            {
                type: "separator"
            },
            {
                type: "item",
                icon: "sort content descending",
                title: "Sort in ascending order",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "asc" },
                isDisabledSelector: state => isFetchingObjects(state),
                isActiveSelector: state => state.objectsUI.paginationInfo.sortOrder === "asc"
            },
            {
                type: "item",
                icon: "sort content ascending",
                title: "Sort in descending order",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "desc" },
                isDisabledSelector: state => isFetchingObjects(state),
                isActiveSelector: state => state.objectsUI.paginationInfo.sortOrder === "desc"
            },
        
            {
                type: "separator"
            },
            {
                type: "item",
                icon: "font",
                title: "Sort by object name",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "object_name" },
                isDisabledSelector: state => isFetchingObjects(state),
                isActiveSelector: state => state.objectsUI.paginationInfo.sortField === "object_name"
            },
            {
                type: "item",
                icon: "clock outline",
                title: "Sort by modify time",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "modified_at" },
                isDisabledSelector: state => isFetchingObjects(state),
                isActiveSelector: state => state.objectsUI.paginationInfo.sortField === "modified_at"
            },
        
            {
                type: "separator",
                hideWhenNotFullscreen: true
            },
        ]
    },
    
    {
        type: "group",
        items: [
            {
                type: "filter",
                isDisabledSelector: state => isFetchingObjects(state),
                placeholder: "Filter objects",
                valueSelector: state => state.objectsUI.paginationInfo.filterText,
                onChange: params => setObjectsPaginationInfo(params),    // action for updating input input text (which is kept in state)
                onChangeDelayed: params => setObjectsPaginationInfoAndFetchPage(params),     // action for performing a fetch with a delay from the last onChange event
                getOnChangeParams: text => ({ filterText: text })
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
                type: "dropdown",
                placeholder: "Filter by object type",
                isDisabledSelector: state => isFetchingObjects(state),
                defaultValueSelector: state => state.objectsUI.paginationInfo.objectTypes,
                options: Object.values(enumObjectTypes).map((t, k) => ({ key: k, text: t.multipleName, value: t.type })),
                getOnChangeAction: (e, data) => setObjectsPaginationInfoAndFetchPage({ objectTypes: data.value })
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
                type: "updatableDropdown",
                placeholder: "Filter objects by tags", 
                isDisabledSelector: state => isFetchingObjects(state), 
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
                isDisabledSelector: state => isFetchingObjects(state) || state.objectsUI.paginationInfo.tagsFilter.length == 0
            }
        ]
    }
];


// Immutable selectors
const selectedObjectIDsSelector = state => state.objectsUI.selectedObjectIDs;
const pageObjectIDsSelector = state => state.objectsUI.paginationInfo.currentPageObjectIDs;
const paginationInfoSelector = state => state.objectsUI.paginationInfo;


// FieldItem creating component for /objects/list page
const ObjectsFieldItem = memo(({ id }) => {
    const textSelector = useMemo(() => state => state.objects[id] ? state.objects[id].object_name : "?", [id]);
    const isCheckedSelector = useMemo(() => state => state.objectsUI.selectedObjectIDs.includes(id), [id]);
    const link = useMemo(() => `/objects/edit/${id}`, [id]);
    return <FieldItem id={id} textSelector={textSelector} link={link} 
    isCheckedSelector={isCheckedSelector} onChange={toggleObjectSelection} />;
});


// Tags filter
const TagsFilterItem = memo(({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    // const isRemoved = useSelector(state => state.objectsUI.removedTagIDs.includes(id));
    // const itemClassName = isRemoved ? "inline-item deleted" : "inline-item";
    const itemClassName = "inline-item filter";
    const onClick = useMemo(() => () => dispatch(setTagsFilterAndFetchPage(id)), [id]);
    const itemLink = `/tags/${id}`;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
});
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
const CommonCurrentTagItem = memo(({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const isRemoved = useSelector(state => state.objectsUI.removedTagIDs.includes(id));
    const itemClassName = isRemoved ? "inline-item deleted" : "inline-item";
    const onClick = useMemo(() => () => dispatch(setCurrentObjectsTags({ removed: [id] })), [id]);
    const itemLink = `/tags/${id}`;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
});
const AddedTagItem = memo(({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => typeof(id) === "string" ? id : (state.tags[id] ? state.tags[id].tag_name : id));
    const itemClassName = typeof(id) === "number" ? "inline-item existing" : "inline-item new";
    const onClick = useMemo(() => () => dispatch(setCurrentObjectsTags({ added: [id] })), [id]);
    const itemLink = typeof(id) === "number" ? `/tags/${id}` : undefined;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
});
const PartiallyAppliedTagItem = memo(({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => typeof(id) === "string" ? id : state.tags[id] ? state.tags[id].tag_name : id);
    const isAdded = useSelector(state => state.objectsUI.addedTags.includes(id));
    const isRemoved = useSelector(state => state.objectsUI.removedTagIDs.includes(id));
    const itemClassName = isAdded ? "inline-item existing" : isRemoved ? "inline-item deleted" : "inline-item";
    const onClick = useMemo(
        () => isAdded ? () => dispatch(setCurrentObjectsTags({ added: [id], removed: [id] })) :   // current => added => removed => current
        isRemoved ? () => dispatch(setCurrentObjectsTags({ removed: [id] })) : 
        () => dispatch(setCurrentObjectsTags({ added: [id] }))
    , [isAdded, isRemoved, id]);
    const itemLink = typeof(id) === "number" ? `/tags/${id}` : undefined;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
});

const inputStateSelector = state => state.objectsUI.tagsInput;

const inlineInputDropdownItemTextSelectors = { itemStoreSelector: state => state.tags, itemTextSelector: (store, id) => store[id].tag_name };

const commonTagsWrapperIsDisplayedSelector = state => state.objectsUI.selectedObjectIDs.length > 0;
const partiallyAppliedTagsWrapperIsDisplayedSelector = state => partiallyAppliedTagIDsSelector(state).length > 0;

const ObjectsTags = () => {
    // const renderBlock = useSelector(commonTagsWrapperIsDisplayedSelector) || useSelector(partiallyAppliedTagsWrapperIsDisplayedSelector);
    const shouldRenderCommonTags = useSelector(commonTagsWrapperIsDisplayedSelector);
    const shouldRenderPartiallyAppliedTags = useSelector(partiallyAppliedTagsWrapperIsDisplayedSelector)

    return (shouldRenderCommonTags || shouldRenderPartiallyAppliedTags) && (
        <InlineItemListBlock>
            <InlineItemListWrapper header="Common Tags" isDisplayedSelector={commonTagsWrapperIsDisplayedSelector}>
                <InlineItemList itemIDSelector={commonTagIDsSelector} ItemComponent={CommonCurrentTagItem} />
                <InlineItemList itemIDSelector={addedTagsSelector} ItemComponent={AddedTagItem} />
                {/* <InlineInput inputStateSelector={inputStateSelector} setInputState={setObjectsTagsInput} inputPlaceholder="Enter tag name..." onChangeDelayed={objectsTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} getItemTextSelector={getItemTextSelector} setItem={setCurrentObjectsTags} /> */}
                <InlineInput placeholder="Enter tag name..." inputStateSelector={inputStateSelector} setInputState={setObjectsTagsInput} onSearchChangeDelayed={objectsTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} setItem={setCurrentObjectsTags} getDropdownItemTextSelectors={inlineInputDropdownItemTextSelectors} />
            </InlineItemListWrapper>

            <InlineItemListWrapper header="Partially Applied Tags" isDisplayedSelector={partiallyAppliedTagsWrapperIsDisplayedSelector}>
                <InlineItemList itemIDSelector={partiallyAppliedTagIDsSelector} ItemComponent={PartiallyAppliedTagItem} />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    )
};
