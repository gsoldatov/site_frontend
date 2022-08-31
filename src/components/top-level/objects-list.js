import React, { memo, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import Layout from "../common/layout";
import Error from "../common/error";
import { FieldMenu, FieldMenuGroup, FieldMenuButton, FieldMenuFilter, FieldMenuDropdown, FieldMenuUpdatableDropdown } from "../field/field-menu";
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
        setTagsFilterAndFetchPage, tagsFilterDropdownFetch, } from "../../fetches/ui-objects-list";
import { isFetchingObjects, isFetchingOrShowingDeleteDialogObjects, isObjectsTagsEditActive,
    commonTagIDsSelector, partiallyAppliedTagIDsSelector, existingIDsSelector, addedTagsSelector } from "../../store/state-util/ui-objects-list";
import { enumObjectTypes } from "../../util/enum-object-types";
import { createSelector } from "reselect";


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
            <ObjectsListFieldMenu />
            <TagsFilter />
            {pageBody}
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={pageBodyWithMenu} />;
};


const ObjectsListFieldMenu = () => {
    const dispatch = useDispatch();

    // Common props
    const isDisabled = useSelector(state => isFetchingObjects(state));
    
    // Select all objects button
    const currentPageObjectIDs = useSelector(state => state.objectsUI.paginationInfo.currentPageObjectIDs);
    const selectAllOnClick = useMemo(() => () => dispatch(selectObjects(currentPageObjectIDs)), [currentPageObjectIDs]);

    // Deselect all objects button
    const deselectAllOnClick = useMemo(() => () => dispatch(clearSelectedObjects()), []);

    // Sort asc button
    const sortAscOnClick = useMemo(() => () => dispatch(setObjectsPaginationInfoAndFetchPage({ sortOrder: "asc" })), []);
    const sortAscIsActive = useSelector(state => state.objectsUI.paginationInfo.sortOrder === "asc");

    // Sort desc button
    const sortDescOnClick = useMemo(() => () => dispatch(setObjectsPaginationInfoAndFetchPage({ sortOrder: "desc" })), []);
    const sortDescIsActive = useSelector(state => state.objectsUI.paginationInfo.sortOrder === "desc");

    // Sort by name button
    const sortByNameOnClick = useMemo(() => () => dispatch(setObjectsPaginationInfoAndFetchPage({ sortField: "object_name" })), []);
    const sortByNameIsActive = useSelector(state => state.objectsUI.paginationInfo.sortField === "object_name");

    // Sort by modify time button
    const sortByModifyTimeOnClick = useMemo(() => () => dispatch(setObjectsPaginationInfoAndFetchPage({ sortField: "modified_at" })), []);
    const sortByModifyTimeIsActive = useSelector(state => state.objectsUI.paginationInfo.sortField === "modified_at");

    // Object name filter
    const objectNameFilterValue = useSelector(state => state.objectsUI.paginationInfo.filterText);
    const objectNameFilterOnChange = useMemo(() => value => dispatch(setObjectsPaginationInfo({ filterText: value })), []);
    const objectNameFilterOnChangeDelayed = useMemo(() => value => dispatch(setObjectsPaginationInfoAndFetchPage({ filterText: value })), []);

    // Object type dropdown
    const objectTypesDefaultValue = useSelector(state => state.objectsUI.paginationInfo.objectTypes);
    const objectTypesOptions = useMemo(() => Object.values(enumObjectTypes).map((t, k) => ({ key: k, text: t.multipleName, value: t.type })), []);
    const objectTypesOnChange = useMemo(() => (e, data) => dispatch(setObjectsPaginationInfoAndFetchPage({ objectTypes: data.value })), []);

    // Tags filter dropdown
    const tagsFilterInputState = useSelector(state => state.objectsUI.tagsFilterInput);
    const tagsFilterExistingIDs = useSelector(state => state.objectsUI.paginationInfo.tagsFilter);
    const tagsFilterOptionsSelector = useMemo(() => createSelector(
        state => state.tags,
        state => state.objectsUI.tagsFilterInput,
        (tags, inputState) => {
            return inputState.matchingIDs.map(tagID => {
                return { key: tagID, text: tags[tagID].tag_name, value: tagID };
            });
        }
    ), []);
    const tagsFilterOptions = useSelector(tagsFilterOptionsSelector);
    
    const tagsFilterOnSearchChange = useMemo(() => inputParams => dispatch(setTagsFilterInput(inputParams)), []);
    const tagsFilterOnSearchChangeDelayed = useMemo(() => inputParams => dispatch(tagsFilterDropdownFetch(inputParams)), []);
    const tagsFilterOnChange = useMemo(() => values => dispatch(setTagsFilterAndFetchPage(values)), []);

    // Tags filter clear button
    const tagsFilterClearOnClick = useMemo(() => () => dispatch(setTagsFilterAndFetchPage()), []);
    const tagsFilterClearIsDisabled = useSelector(state => isFetchingObjects(state) || state.objectsUI.paginationInfo.tagsFilter.length == 0);

    return (
        <FieldMenu>
            <FieldMenuGroup isButtonGroup>
                <FieldMenuButton icon="check" title="Select all objects on page" onClick={selectAllOnClick} isDisabled={isDisabled} />
                <FieldMenuButton icon="cancel" title="Deselect all objects" onClick={deselectAllOnClick} isDisabled={isDisabled} />
                <FieldMenuButton icon="sort content descending" title="Sort in ascending order" onClick={sortAscOnClick} 
                    isDisabled={isDisabled} isActive={sortAscIsActive} />
                <FieldMenuButton icon="sort content ascending" title="Sort in descending order" onClick={sortDescOnClick} 
                    isDisabled={isDisabled} isActive={sortDescIsActive} />
                <FieldMenuButton icon="font" title="Sort by object name" onClick={sortByNameOnClick} 
                    isDisabled={isDisabled} isActive={sortByNameIsActive} />
                <FieldMenuButton icon="clock outline" title="Sort by modify time" onClick={sortByModifyTimeOnClick} 
                    isDisabled={isDisabled} isActive={sortByModifyTimeIsActive} />
            </FieldMenuGroup>
            
            <FieldMenuGroup>
                <FieldMenuFilter value={objectNameFilterValue} placeholder="Filter objects" isDisabled={isDisabled}
                    onChange={objectNameFilterOnChange} onChangeDelayed={objectNameFilterOnChangeDelayed} />
            </FieldMenuGroup>

            <FieldMenuGroup>
                <FieldMenuDropdown defaultValue={objectTypesDefaultValue} options={objectTypesOptions} onChange={objectTypesOnChange}
                    placeholder="Filter by object type" isDisabled={isDisabled} />
            </FieldMenuGroup>

            <FieldMenuGroup>
                <FieldMenuUpdatableDropdown placeholder="Filter objects by tags" isDisabled={isDisabled}
                    inputState={tagsFilterInputState} existingIDs={tagsFilterExistingIDs} options={tagsFilterOptions} 
                    onSearchChange={tagsFilterOnSearchChange} onSearchChangeDelayed={tagsFilterOnSearchChangeDelayed} onChange={tagsFilterOnChange} />
                <FieldMenuButton icon="remove" title="Clear tags filter" className="borderless" onClick={tagsFilterClearOnClick} isDisabled={tagsFilterClearIsDisabled} />
            </FieldMenuGroup>
        </FieldMenu>
    );
};


// Immutable selectors
const selectedObjectIDsSelector = state => state.objectsUI.selectedObjectIDs;
const pageObjectIDsSelector = state => state.objectsUI.paginationInfo.currentPageObjectIDs;
const paginationInfoSelector = state => state.objectsUI.paginationInfo;


// FieldItem creating component for /objects/list page
const ObjectsFieldItem = memo(({ id }) => {
    const textSelector = useMemo(() => state => state.objects[id] ? state.objects[id].object_name : "?", [id]);
    const isCheckedSelector = useMemo(() => state => state.objectsUI.selectedObjectIDs.includes(id), [id]);
    const link = useMemo(() => `/objects/view/${id}`, [id]);
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
    const itemLink = `/tags/edit/${id}`;
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
    const itemLink = `/tags/edit/${id}`;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
});
const AddedTagItem = memo(({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => typeof(id) === "string" ? id : (state.tags[id] ? state.tags[id].tag_name : id));
    const itemClassName = typeof(id) === "number" ? "inline-item existing" : "inline-item new";
    const onClick = useMemo(() => () => dispatch(setCurrentObjectsTags({ added: [id] })), [id]);
    const itemLink = typeof(id) === "number" ? `/tags/edit/${id}` : undefined;
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
    const itemLink = typeof(id) === "number" ? `/tags/edit/${id}` : undefined;
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
