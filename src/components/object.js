import React, { useEffect, useMemo, useRef } from "react";
import { Header, Tab } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { LoadIndicatorAndError, SaveError, TimeStamps, NameDescriptionInput } from "./edit/common";
import { ObjectTypeSelector, ObjectViewEditSwitch } from "./edit/object";
import Layout from "./common/layout";
import { InlineItemListBlock, InlineItemListWrapper } from "./inline/inline-item-list-containers";
import { InlineItemList } from "./inline/inline-item-list";
import { InlineItem } from "./inline/inline-item";
import { InlineInput } from "./inline/inline-input";

import { getCurrentObject, isFetchingObject, isFetchingOrOnLoadFetchFailed } from "../store/state-util/ui-object";
import { setRedirectOnRender } from "../actions/common";
import { loadAddObjectPage, addDefaultEditedObject, resetEditedObject, setEditedObject, setEditedObjectTags, setSelectedTab, setObjectTagsInput, 
         setShowResetDialogObject, setShowDeleteDialogObject } from "../actions/object";
import { addObjectOnSaveFetch, editObjectOnLoadFetch, editObjectOnSaveFetch, editObjectOnDeleteFetch, objectTagsDropdownFetch } from "../fetches/ui-object";


/*
    /objects/:id page components.
*/
// Exports
export const AddObject = () => {
    const id = 0;
    return <_Object sideMenuItems={addObjectSideMenuItems} objectID={id} onLoad={loadAddObjectPage()} header="Add a New Object" />;
};

export const EditObject = () => {
    let { id } = useParams();
    id = parseInt(id);
    return <_Object sideMenuItems={editObjectSideMenuItems} objectID={id} onLoad={editObjectOnLoadFetch(id)} header="Object Information" />;
};

// Add object page side menu items
const addObjectSideMenuItems = [
    {
        type: "item",
        text: "Save",
        isActiveSelector: state => !isFetchingObject(state) && 
                                getCurrentObject(state).object_name.length >= 1 && getCurrentObject(state).object_name.length <= 255,
        onClick: addObjectOnSaveFetch()
    },

    {
        type: "item",
        text: "Reset",
        isVisibleSelector: state => !state.objectUI.showResetDialog,
        isActiveSelector: state => !isFetchingObject(state),
        onClick: setShowResetDialogObject(true)
    },
    {
        type: "dialog",
        text: "Reset This Object?",
        isVisibleSelector: state => state.objectUI.showResetDialog,
        buttons: [
            {
                text: "Yes",
                onClick: addDefaultEditedObject(0)
            },
            {
                text: "No",
                onClick: setShowResetDialogObject(false)
            }
        ]
    },

    {
        type: "item",
        text: "Cancel",
        isActiveSelector: state => !isFetchingObject(state),
        onClick: setRedirectOnRender("/objects")
    }
];


// Edit object page side menu items
const editObjectSideMenuItems = [
    {
        type: "item",
        text: "Add Object",
        isActiveSelector: state => !isFetchingObject(state),
        onClick: setRedirectOnRender("/objects/add")
    },

    {
        type: "item",
        text: "Save",
        isActiveSelector: state => !isFetchingObject(state) && 
                                getCurrentObject(state).object_name.length >= 1 && getCurrentObject(state).object_name.length <= 255,
        onClick: editObjectOnSaveFetch()
    },

    {
        type: "item",
        text: "Reset",
        isVisibleSelector: state => !state.objectUI.showResetDialog,
        isActiveSelector: state => !isFetchingOrOnLoadFetchFailed(state),
        onClick: setShowResetDialogObject(true)
    },
    {
        type: "dialog",
        text: "Reset This Object?",
        isVisibleSelector: state => state.objectUI.showResetDialog,
        buttons: [
            {
                text: "Yes",
                onClick: resetEditedObject()
            },
            {
                text: "No",
                onClick: setShowResetDialogObject(false)
            }
        ]
    },
    
    {
        type: "item",
        text: "Delete",
        isVisibleSelector: state => !state.objectUI.showDeleteDialog,
        isActiveSelector: state => !isFetchingOrOnLoadFetchFailed(state),
        onClick: setShowDeleteDialogObject(true)
    },
    {
        type: "dialog",
        text: "Delete This Object?",
        isVisibleSelector: state => state.objectUI.showDeleteDialog,
        buttons: [
            {
                text: "Yes",
                onClick: editObjectOnDeleteFetch()
            },
            {
                text: "No",
                onClick: setShowDeleteDialogObject(false)
            }
        ]
    },

    {
        type: "item",
        text: "Cancel",
        isActiveSelector: state => !isFetchingObject(state),
        onClick: setRedirectOnRender("/objects")
    }
];


// Basic add/edit object page
const _Object = ({ header, sideMenuItems, onLoad, objectID }) => {
    const dispatch = useDispatch();

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

    return <Layout sideMenuItems={sideMenuItems} body={pageBody} />;
};


const selectedTabSelector = state => state.objectUI.selectedTab;
const ObjectTabPanes = ({ objectID }) => {
    // Object attribute & data tabs
    const tabPanes = useMemo(() => [
        { menuItem: "General", render: () => 
            <Tab.Pane>
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
        }
    ], [objectID]);

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
        <NameDescriptionInput nameLabel="Object Name" namePlaceholder="Object name" name={name} nameOnChange={nameOnChange}
            descriptionLabel="Object Description" descriptionPlaceholder="Object description" description={description} descriptionOnChange={descriptionOnChange} />
    );
};


// Object's tags
const addedTagsSelector = state => getCurrentObject(state).addedTags;
const AddedTagItem = ({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => typeof(id) === "string" ? id : state.tags[id] ? state.tags[id].tag_name : id);
    const itemClassName = typeof(id) === "number" ? "inline-item-green" : "inline-item-blue";
    const onClick = () => dispatch(setEditedObjectTags({ added: [id] }));
    const itemLink = typeof(id) === "number" ? `/tags/${id}` : undefined;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
};
const currentTagsSelector = state => getCurrentObject(state).currentTagIDs;
const CurrentTagItem = ({ id }) => {
    const dispatch = useDispatch();
    // const text = useSelector(state => state.tags[id].tag_name);
    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const isRemoved = useSelector(state => getCurrentObject(state).removedTagIDs.includes(id));
    const itemClassName = isRemoved ? "inline-item-red" : "inline-item";
    const onClick = () => dispatch(setEditedObjectTags({ removed: [id] }));
    const itemLink = `/tags/${id}`;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
};

const inputStateSelector = state => state.objectUI.tagsInput;
const existingIDsSelector = state => getCurrentObject(state).currentTagIDs.concat(
    getCurrentObject(state).addedTags.filter(tag => typeof(tag) === "number"));
// const getItemTextSelector = id => state => state.tags[id] ? state.tags[id].tag_name : id;
const inlineInputDropdownItemTextSelectors = { itemStoreSelector: state => state.tags, itemTextSelector: (store, id) => store[id].tag_name };
const ObjectTags = () => {
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
