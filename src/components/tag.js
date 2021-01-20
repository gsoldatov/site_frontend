import React, { useEffect } from "react";
import { Header } from "semantic-ui-react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { LoadIndicatorAndError, SaveError, TimeStamps, NameDescriptionInput } from "./edit/common";
import Layout from "./common/layout";

import { isFetchingTag, isFetchinOrShowingDialogTag } from "../store/state-check-functions";
import { setRedirectOnRender } from "../actions/common";
import { loadAddTagPage, setCurrentTag, setShowDeleteDialogTag, 
    addTagOnSaveFetch, editTagOnLoadFetch, editTagOnSaveFetch, editTagOnDeleteFetch } from "../actions/tag";

import StyleCommon from "../styles/common.css";


/*
    /objects/:id page components.
*/
// Exports
export const AddTag = () => {
    return <Tag sideMenuItems={addTagSideMenuItems} onLoad={loadAddTagPage()} header="Add a New Tag" />;
};

export const EditTag = () => {
    const { id } = useParams();
    return <Tag sideMenuItems={editTagSideMenuItems} onLoad={editTagOnLoadFetch(id)} header="Tag Information" />;
};

// Add tag page side menu items
const addTagSideMenuItems = [
    {
        type: "item",
        text: "Save",
        getIsActive: state => !isFetchingTag(state) && 
                                state.tagUI.currentTag.tag_name.length >= 1 && state.tagUI.currentTag.tag_name.length <= 255,
        onClick: addTagOnSaveFetch()
    },
    {
        type: "item",
        text: "Cancel",
        getIsActive: state => !isFetchingTag(state),
        onClick: setRedirectOnRender("/tags")
    }
];


// Edit tag page side menu items
const editTagSideMenuItems = [
    {
        type: "item",
        text: "Save",
        getIsActive: state => !isFetchingTag(state) && 
                                state.tagUI.currentTag.tag_name.length >= 1 && state.tagUI.currentTag.tag_name.length <= 255,
        onClick: editTagOnSaveFetch()
    },
    {
        type: "item",
        text: "Delete",
        getIsVisible: state => !state.tagUI.showDeleteDialog,
        getIsActive: state => !isFetchinOrShowingDialogTag(state) && state.tagUI.currentTag.tag_id !== 0,
        onClick: setShowDeleteDialogTag(true)
    },
    {
        type: "dialog",
        text: "Delete This Tag?",
        getIsVisible: state => state.tagUI.showDeleteDialog,
        buttons: [
            {
                text: "Yes",
                onClick: editTagOnDeleteFetch()
            },
            {
                text: "No",
                onClick: setShowDeleteDialogTag(false)
            }
        ]
    },
    {
        type: "item",
        text: "Cancel",
        getIsActive: state => !isFetchingTag(state),
        onClick: setRedirectOnRender("/tags")
    }
];


// Basic add/edit tag page
const Tag = ({ header, sideMenuItems, onLoad }) => {
    const dispatch = useDispatch();
    const { id } = useParams();

    // On load action (also triggers when tag ids change)
    useEffect(() => {
        dispatch(onLoad);
    }, [id]);

    const loadIndicatorAndError = LoadIndicatorAndError({ fetchSelector: onLoadFetchSelector }) && <LoadIndicatorAndError fetchSelector={onLoadFetchSelector} />;
    const pageBody = loadIndicatorAndError || (
        <>
            <Header as="h3" className="add-edit-page-header">{header}</Header>
            <TagTimeStamps />
            <TagSaveError />
            <TagInput />
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={pageBody} />;
};


// OnLoad fetch selector
const onLoadFetchSelector = state => state.tagUI.tagOnLoadFetch;


// Created at & modified at timestamps
const createdAtSelector = state => state.tagUI.currentTag.created_at;
const modifiedAtSelector = state => state.tagUI.currentTag.modified_at;
const TagTimeStamps = () => <TimeStamps createdAtSelector={createdAtSelector} modifiedAtSelector={modifiedAtSelector} />;


// Save fetch error message
const fetchSelector = state => state.tagUI.tagOnSaveFetch;
const TagSaveError = () => <SaveError fetchSelector={fetchSelector} />;


// Tag input form
const nameSelector = state => state.tagUI.currentTag.tag_name;
const getNameOnChangeParams = value => ({tag_name: value });
const descriptionSelector = state => state.tagUI.currentTag.tag_description;
const getDescriptionOnChangeParams = value => ({tag_description: value });
const TagInput = () => <NameDescriptionInput nameLabel="Tag Name" namePlaceholder="Tag name" nameSelector={nameSelector} nameOnChange={setCurrentTag} getNameOnChangeParams={getNameOnChangeParams}
    descriptionLabel="Tag Description" descriptionPlaceholder="Tag description" descriptionSelector={descriptionSelector} descriptionOnChange={setCurrentTag} getDescriptionOnChangeParams={getDescriptionOnChangeParams} />;
