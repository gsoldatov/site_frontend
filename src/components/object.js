import React, { useEffect } from "react";
import { Header } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { LoadIndicatorAndError, SaveError, TimeStamps, NameDescriptionInput } from "./edit/common";
import { ObjectTypeSelector, ObjectViewEditSwitch } from "./edit/object";
import Layout from "./common/layout";
import { InlineItemListBlock, InlineItemListWrapper } from "./inline/inline-item-list-containers";
import { InlineItemList } from "./inline/inline-item-list";
import { InlineItem } from "./inline/inline-item";
import { InlineInput } from "./inline/inline-input";

import { isFetchingObject, isFetchinOrShowingDialogObject } from "../store/state-util/ui-object";
import { setRedirectOnRender } from "../actions/common";
import { loadAddObjectPage, setCurrentObject, setCurrentObjectTags, setObjectTagsInput, setShowDeleteDialogObject } from "../actions/object";
import { addObjectOnSaveFetch, editObjectOnLoadFetch, editObjectOnSaveFetch, editObjectOnDeleteFetch, objectTagsDropdownFetch } from "../fetches/ui-object";

import StyleCommon from "../styles/common.css";


/*
    /objects/:id page components.
*/
// Exports
export const AddObject = () => {
    return <_Object sideMenuItems={addObjectSideMenuItems} onLoad={loadAddObjectPage()} header="Add a New Object" />;
};

export const EditObject = () => {
    const { id } = useParams();
    return <_Object sideMenuItems={editObjectSideMenuItems} onLoad={editObjectOnLoadFetch(id)} header="Object Information" />;
};

// Add object page side menu items
const addObjectSideMenuItems = [
    {
        type: "item",
        text: "Save",
        isActiveSelector: state => !isFetchingObject(state) && 
                                state.objectUI.currentObject.object_name.length >= 1 && state.objectUI.currentObject.object_name.length <= 255,
        onClick: addObjectOnSaveFetch()
    },
    {
        type: "item",
        text: "Reset",
        isActiveSelector: state => !isFetchingObject(state),
        onClick: loadAddObjectPage(true)
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
                                state.objectUI.currentObject.object_name.length >= 1 && state.objectUI.currentObject.object_name.length <= 255,
        onClick: editObjectOnSaveFetch()
    },
    {
        type: "item",
        text: "Delete",
        isVisibleSelector: state => !state.objectUI.showDeleteDialog,
        isActiveSelector: state => !isFetchinOrShowingDialogObject(state) && state.objectUI.currentObject.object_id !== 0,
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
const _Object = ({ header, sideMenuItems, onLoad }) => {
    const dispatch = useDispatch();
    const { id } = useParams();

    // On load action (also triggers when object ids change)
    useEffect(() => {
        dispatch(onLoad);
    }, [id]);

    const loadIndicatorAndError = LoadIndicatorAndError({ fetchSelector: onLoadFetchSelector }) && <LoadIndicatorAndError fetchSelector={onLoadFetchSelector} />;
    const pageBody = loadIndicatorAndError || (
        <>
            <Header as="h3" className="add-edit-page-header">{header}</Header>
            <ObjectTypeSelector />
            <ObjectTimeStamps />
            <ObjectSaveError />
            <ObjectInput />
            <ObjectTags />
            <ObjectViewEditSwitch />
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={pageBody} />;
};


// OnLoad fetch selector
const onLoadFetchSelector = state => state.objectUI.objectOnLoadFetch;


// Created at & modified at timestamps
const createdAtSelector = state => state.objectUI.currentObject.created_at;
const modifiedAtSelector = state => state.objectUI.currentObject.modified_at;
const ObjectTimeStamps = () => <TimeStamps createdAtSelector={createdAtSelector} modifiedAtSelector={modifiedAtSelector} />;


// Save fetch error message
const fetchSelector = state => state.objectUI.objectOnSaveFetch;
const ObjectSaveError = () => <SaveError fetchSelector={fetchSelector} />;


// Object input form
const nameSelector = state => state.objectUI.currentObject.object_name;
const getNameOnChangeParams = value => ({object_name: value });
const descriptionSelector = state => state.objectUI.currentObject.object_description;
const getDescriptionOnChangeParams = value => ({object_description: value });
const ObjectInput = () => <NameDescriptionInput nameLabel="Object Name" namePlaceholder="Object name" nameSelector={nameSelector} nameOnChange={setCurrentObject} getNameOnChangeParams={getNameOnChangeParams}
    descriptionLabel="Object Description" descriptionPlaceholder="Object description" descriptionSelector={descriptionSelector} descriptionOnChange={setCurrentObject} getDescriptionOnChangeParams={getDescriptionOnChangeParams} />;


// Object's tags
const addedTagsSelector = state => state.objectUI.currentObject.addedTags;
const AddedTagItem = ({ id }) => {
    const dispatch = useDispatch();
    const text = useSelector(state => typeof(id) === "string" ? id : state.tags[id] ? state.tags[id].tag_name : id);
    const itemClassName = typeof(id) === "number" ? "inline-item-green" : "inline-item-blue";
    const onClick = () => dispatch(setCurrentObjectTags({ added: [id] }));
    const itemLink = typeof(id) === "number" ? `/tags/${id}` : undefined;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
};
const currentTagsSelector = state => state.objectUI.currentObject.currentTagIDs;
const CurrentTagItem = ({ id }) => {
    const dispatch = useDispatch();
    // const text = useSelector(state => state.tags[id].tag_name);
    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const isRemoved = useSelector(state => state.objectUI.currentObject.removedTagIDs.includes(id));
    const itemClassName = isRemoved ? "inline-item-red" : "inline-item";
    const onClick = () => dispatch(setCurrentObjectTags({ removed: [id] }));
    const itemLink = `/tags/${id}`;
    return <InlineItem text={text} itemClassName={itemClassName} onClick={onClick} itemLink={itemLink} />;
};

const inputStateSelector = state => state.objectUI.currentObject.tagsInput;
const existingIDsSelector = state => state.objectUI.currentObject.currentTagIDs.concat(
    state.objectUI.currentObject.addedTags.filter(tag => typeof(tag) === "number"));
// const getItemTextSelector = id => state => state.tags[id] ? state.tags[id].tag_name : id;
const inlineInputDropdownItemTextSelectors = { itemStoreSelector: state => state.tags, itemTextSelector: (store, id) => store[id].tag_name };
const ObjectTags = () => {
    return (
        <InlineItemListBlock header="Tags">
            <InlineItemListWrapper>
                <InlineItemList itemIDSelector={currentTagsSelector} ItemComponent={CurrentTagItem} />
                <InlineItemList itemIDSelector={addedTagsSelector} ItemComponent={AddedTagItem} />
                {/* <InlineInput inputStateSelector={inputStateSelector} setInputState={setObjectTagsInput} inputPlaceholder="Enter tag name..." onChangeDelayed={objectTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} getItemTextSelector={getItemTextSelector} setItem={setCurrentObjectTags} /> */}
                <InlineInput placeholder="Enter tag name..." inputStateSelector={inputStateSelector} setInputState={setObjectTagsInput} onSearchChangeDelayed={objectTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} setItem={setCurrentObjectTags} getDropdownItemTextSelectors={inlineInputDropdownItemTextSelectors} />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    );
};
