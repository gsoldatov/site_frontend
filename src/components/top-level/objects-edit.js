import React, { memo, useEffect, useMemo, useRef } from "react";
import { Header, Tab } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { createSelector } from "reselect";

import { LoadIndicatorAndError, SaveError, TimeStamps, NameInput, DescriptionEditor } from "../edit/common/edit-page";
import { ObjectTypeSelector, ObjectViewEditSwitch } from "../edit/objects-edit";
import { DisplayTab } from "../edit/objects-edit-display-controls/display-tab";
import Layout from "../common/layout";
import { InlineItemListBlock, InlineItemListWrapper } from "../inline/inline-item-list-containers";
import { InlineItemList } from "../inline/inline-item-list";
import { InlineItem } from "../inline/inline-item";
import { InlineInput } from "../inline/inline-input";

import { getCurrentObject, isFetchingObject, isFetchingOrOnLoadFetchFailed } from "../../store/state-util/ui-objects-edit";
import { resetEditedObjects, setEditedObject, setEditedObjectTags, setSelectedTab, setObjectTagsInput, 
         setShowResetDialogObject, setShowDeleteDialogObject } from "../../actions/objects-edit";
import { addObjectOnLoad, addObjectOnSaveFetch, editObjectOnLoadFetch, editObjectOnSaveFetch, editObjectOnDeleteFetch, objectTagsDropdownFetch } from "../../fetches/ui-objects-edit";

import { isMultiColumnCompositeDataDisplayed } from "../../store/state-util/composite";
import { enumLayoutTypes } from "../../util/enum-layout-types";


/*
    /objects/edit/:id page components.
*/
// Exports
export const NewObject = () => {
    const dispatch = useDispatch();

    const addObjectSideMenuItems = useMemo(() => [
        {
            type: "item",
            text: "Save",
            icon: "save outline",
            isActiveSelector: state => !isFetchingObject(state) && 
                                    getCurrentObject(state).object_name.length >= 1 && getCurrentObject(state).object_name.length <= 255,
            onClick: () => dispatch(addObjectOnSaveFetch())
        },

        {
            type: "item",
            text: "Reset",
            icon: "undo",
            isVisibleSelector: state => !state.objectUI.showResetDialog,
            isActiveSelector: state => !isFetchingObject(state),
            onClick: () => dispatch(setShowResetDialogObject(true))
        },
        {
            type: "dialog",
            text: "Reset This Object?",
            isVisibleSelector: state => state.objectUI.showResetDialog,
            isCheckboxDisplayedSelector: state => getCurrentObject(state).object_type === "composite", 
            checkboxText: "Reset subobjects",
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: resetCompositeSubobjects => dispatch(resetEditedObjects({ hideObjectResetDialog: true, allowResetToDefaults: true, 
                        defaultDisplayInFeed: true, resetCompositeSubobjects }))
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowResetDialogObject(false))
                }
            ]
        },

        {
            type: "linkItem",
            text: "Cancel",
            icon: "sign-out",
            iconFlipped: "horizontally",
            isActiveSelector: state => !isFetchingObject(state),
            linkURL: "/objects/list"
        }
    ]);

    const id = 0;
    return <_Object sideMenuItems={addObjectSideMenuItems} objectID={id} onLoad={addObjectOnLoad()} header="Add a New Object" />;
};


export const EditObject = () => {
    const dispatch = useDispatch();
    let { id } = useParams();
    id = parseInt(id);

    const editObjectSideMenuItems = useMemo(() => [
        {
            type: "linkItem",
            text: "Add a New Object",
            icon: "add",
            iconColor: "green",
            isActiveSelector: state => !isFetchingObject(state),
            linkURL: "/objects/edit/new"
        },

        {
            type: "linkItem",
            text: "View Object",
            icon: "eye",
            iconColor: "black",
            isActiveSelector: state => !isFetchingObject(state),
            linkURL: `/objects/view/${id}`
        },

        {
            type: "item",
            text: "Save",
            icon: "save outline",
            isActiveSelector: state => !isFetchingObject(state) && 
                                    getCurrentObject(state).object_name.length >= 1 && getCurrentObject(state).object_name.length <= 255,
            onClick: () => dispatch(editObjectOnSaveFetch())
        },

        {
            type: "item",
            text: "Reset",
            icon: "undo",
            isVisibleSelector: state => !state.objectUI.showResetDialog,
            isActiveSelector: state => !isFetchingOrOnLoadFetchFailed(state),
            onClick: () => dispatch(setShowResetDialogObject(true))
        },
        {
            type: "dialog",
            text: "Reset This Object?",
            isVisibleSelector: state => state.objectUI.showResetDialog,
            isCheckboxDisplayedSelector: state => getCurrentObject(state).object_type === "composite", 
            checkboxText: "Reset subobjects",
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: resetCompositeSubobjects => dispatch(resetEditedObjects({ hideObjectResetDialog: true, resetCompositeSubobjects }))
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowResetDialogObject(false))
                }
            ]
        },
        
        {
            type: "item",
            text: "Delete",
            icon: "trash alternate",
            iconColor: "red",
            isVisibleSelector: state => !state.objectUI.showDeleteDialog,
            isActiveSelector: state => !isFetchingOrOnLoadFetchFailed(state),
            onClick: () => dispatch(setShowDeleteDialogObject(true))
        },
        {
            type: "dialog",
            text: "Delete This Object?",
            isVisibleSelector: state => state.objectUI.showDeleteDialog,
            isCheckboxDisplayedSelector: state => getCurrentObject(state).object_type === "composite", 
            checkboxText: "Delete subobjects",
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: deleteSubobjects => dispatch(editObjectOnDeleteFetch(deleteSubobjects))
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowDeleteDialogObject(false))
                }
            ]
        },

        {
            type: "linkItem",
            text: "Cancel",
            icon: "sign-out",
            iconFlipped: "horizontally",
            isActiveSelector: state => !isFetchingObject(state),
            linkURL: "/objects/list"
        }
    ], [id]);

    return <_Object sideMenuItems={editObjectSideMenuItems} objectID={id} onLoad={editObjectOnLoadFetch(id)} header="Object Information" />;
};


// Basic add/edit object page
const _Object = ({ header, sideMenuItems, onLoad, objectID }) => {
    const dispatch = useDispatch();
    
    const enableStylesForMulticolumnCompositeObjectData = useSelector(isMultiColumnCompositeDataDisplayed);

    // On load action (also triggers when object ids change)
    useEffect(() => {
        dispatch(onLoad);
    }, [objectID]);

    const loadIndicatorAndError = LoadIndicatorAndError({ fetchSelector: onLoadFetchSelector }) && <LoadIndicatorAndError fetchSelector={onLoadFetchSelector} />;
    const pageBody = loadIndicatorAndError || (
        <>
            <Header as="h1">{header}</Header>
            <ObjectSaveError />
            <ObjectTabPanes objectID={objectID} />
        </>
    );

    // Layout type (unlimited width for multicolumn object data)
    const layoutType = enableStylesForMulticolumnCompositeObjectData ? enumLayoutTypes.unlimitedWidth : enumLayoutTypes.default;

    return <Layout sideMenuItems={sideMenuItems} body={pageBody} layoutType={layoutType} />;;
};


const selectedTabSelector = state => state.objectUI.selectedTab;
const ObjectTabPanes = ({ objectID }) => {
    const tabPanes = useMemo(() => {
        return [
            { menuItem: "General", render: () => 
                <Tab.Pane className="objects-edit-general-tab">
                    <ObjectTypeSelector objectID={objectID} />
                    <ObjectTimeStamps />
                    <ObjectInput />
                    <ObjectTags />
                </Tab.Pane> 
            },
            { menuItem: "Data", render: () =>
                <Tab.Pane>
                    <ObjectViewEditSwitch objectID={objectID} />
                </Tab.Pane>
            },
            { menuItem: "Display", render: () =>
                <Tab.Pane>
                    <DisplayTab objectID={objectID} />
                </Tab.Pane>
            }
        ];
    }, [objectID]);

    const activeIndex = useSelector(selectedTabSelector);
    const dispatch = useDispatch();
    const onTabChange = useRef((e, data) => {
        dispatch(setSelectedTab(data.activeIndex));
    }).current;

    return <Tab panes={tabPanes} activeIndex={activeIndex} onTabChange={onTabChange} />;
};


// OnLoad fetch selector
const onLoadFetchSelector = state => state.objectUI.objectOnLoadFetch;


// Created at & modified at timestamps
const createdAtSelector = state => getCurrentObject(state).created_at;
const modifiedAtSelector = state => getCurrentObject(state).modified_at;
const isDisplayedSelector = state => state.objectUI.currentObjectID > 0;
const ObjectTimeStamps = () => <TimeStamps createdAtSelector={createdAtSelector} modifiedAtSelector={modifiedAtSelector} isDisplayedSelector={isDisplayedSelector} />;


// Save fetch error message
const fetchSelector = state => state.objectUI.objectOnSaveFetch;
const ObjectSaveError = () => <SaveError fetchSelector={fetchSelector} />;


// Object input form
const ObjectInput = () => {
    const dispatch = useDispatch();
    const name = useSelector(state => getCurrentObject(state).object_name);
    const description = useSelector(state => getCurrentObject(state).object_description);

    const nameOnChange = useRef(object_name => {
        dispatch(setEditedObject({ object_name }));
    }).current;

    const descriptionOnChange = useRef(object_description => {
        dispatch(setEditedObject({ object_description }));
    }).current;

    return (
        <>
            <NameInput label="Object Name" placeholder="Object name" value={name} onChange={nameOnChange} />
            <DescriptionEditor label="Object Description" placeholder="Object description" value={description} onChange={descriptionOnChange} />
        </>
    );
};


// Object's tags
const AddedTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => typeof(id) === "string" ? id : state.tags[id] ? state.tags[id].tag_name : id);
    const className = typeof(id) === "number" ? "existing" : "new";
    const URL = typeof(id) === "number" ? `/tags/view?tagIDs=${id}` : undefined;
    const icons = useMemo(() => 
        [{ name: "remove", title: "Remove tag", onClick: () => dispatch(setEditedObjectTags({ added: [id] })) }]
    , [id]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});

const CurrentTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const isRemoved = useSelector(state => getCurrentObject(state).removedTagIDs.includes(id));
    const className = isRemoved ? "deleted" : undefined;
    const URL = `/tags/view?tagIDs=${id}`;
    const icons = useMemo(() =>
        [{ 
            name: isRemoved ? "undo" : "remove", 
            title: isRemoved ? "Restore tag" : "Remove tag", 
            onClick: () => { dispatch(setEditedObjectTags({ removed: [id] })) } 
        }]
    , [id, isRemoved]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});

const ObjectTags = () => {
    const currentTagsSelector = useMemo(() => state => getCurrentObject(state).currentTagIDs, []);
    const addedTagsSelector = useMemo(() => state => getCurrentObject(state).addedTags, []);
    const inputStateSelector = useMemo(() => state => state.objectUI.tagsInput, []);
    
    const existingIDsSelector = useMemo(() => createSelector(
        state => getCurrentObject(state).currentTagIDs,
        state => getCurrentObject(state).addedTags,
        (currentTagIDs, addedTags) => currentTagIDs.concat(
            addedTags.filter(tag => typeof(tag) === "number")
        )
    ), []);

    // const getItemTextSelector = useMemo(() => id => state => state.tags[id] ? state.tags[id].tag_name : id, []);
    const inlineInputDropdownItemTextSelectors = useMemo(() => ({ itemStoreSelector: state => state.tags, itemTextSelector: (store, id) => store[id].tag_name }), []);

    return (
        <InlineItemListBlock header="Tags">
            <InlineItemListWrapper>
                <InlineItemList itemIDSelector={currentTagsSelector} ItemComponent={CurrentTagItem} />
                <InlineItemList itemIDSelector={addedTagsSelector} ItemComponent={AddedTagItem} />
                {/* <InlineInput inputStateSelector={inputStateSelector} setInputState={setObjectTagsInput} inputPlaceholder="Enter tag name..." onChangeDelayed={objectTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} getItemTextSelector={getItemTextSelector} setItem={setEditedObjectTags} /> */}
                <InlineInput placeholder="Enter tag name..." inputStateSelector={inputStateSelector} setInputState={setObjectTagsInput} onSearchChangeDelayed={objectTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} setItem={setEditedObjectTags} getDropdownItemTextSelectors={inlineInputDropdownItemTextSelectors} />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    );
};
