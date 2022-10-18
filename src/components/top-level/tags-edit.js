import React, { useEffect, useMemo, useRef } from "react";
import { Header } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { LoadIndicatorAndError, SaveError, TimeStamps, NameInput, DescriptionEditor } from "../edit/common/edit-page";
import Layout from "../common/layout";
import { TagsEditDisplayControls } from "../edit/tags-edit-display-controls/tags-edit-display-controls";

import { isFetchingTag, isFetchinOrShowingDialogTag } from "../../store/state-util/ui-tags-edit";
import { loadNewTagPage, setCurrentTag, setShowDeleteDialogTag } from "../../actions/tags-edit";
import { addTagOnSaveFetch, editTagOnLoadFetch, editTagOnSaveFetch, editTagOnDeleteFetch } from "../../fetches/ui-tags-edit";

import StyleTag from "../../styles/tags-edit.css";


/*
    /objects/edit/:id page components.
*/
// Exports
export const NewTag = () => {
    const dispatch = useDispatch();

    // Side menu items
    const addTagSideMenuItems = useMemo(() => [
        {
            type: "item",
            text: "Save",
            icon: "save outline",
            isActiveSelector: state => !isFetchingTag(state) && 
                                    state.tagUI.currentTag.tag_name.length >= 1 && state.tagUI.currentTag.tag_name.length <= 255,
            onClick: () => dispatch(addTagOnSaveFetch())
        },
        {
            type: "linkItem",
            text: "Cancel",
            icon: "sign-out",
            iconFlipped: "horizontally",
            isActiveSelector: state => !isFetchingTag(state),
            linkURL: "/tags/list"
        }
    ]);

    return <Tag sideMenuItems={addTagSideMenuItems} onLoad={loadNewTagPage()} header="Add a New Tag" />;
};


export const EditTag = () => {
    const dispatch = useDispatch();
    const { id } = useParams();

    // Side menu items
    const editTagSideMenuItems = useMemo(() => [
        {
            type: "linkItem",
            text: "Add a New Tag",
            icon: "add",
            iconColor: "green",
            isActiveSelector: state => !isFetchingTag(state),
            linkURL: "/tags/edit/new"
        },
        {
            type: "linkItem",
            text: "View Tag",
            icon: "eye",
            iconColor: "black",
            isActiveSelector: state => !isFetchingTag(state),
            linkURL: `/tags/view?tagIDs=${id}`
        },
        {
            type: "item",
            text: "Save",
            icon: "save outline",
            isActiveSelector: state => !isFetchingTag(state) && 
                                    state.tagUI.currentTag.tag_name.length >= 1 && state.tagUI.currentTag.tag_name.length <= 255,
            onClick: () => dispatch(editTagOnSaveFetch())
        },
        {
            type: "item",
            text: "Delete",
            icon: "trash alternate",
            iconColor: "red",
            isVisibleSelector: state => !state.tagUI.showDeleteDialog,
            isActiveSelector: state => !isFetchinOrShowingDialogTag(state) && state.tagUI.currentTag.tag_id !== 0,
            onClick: () => dispatch(setShowDeleteDialogTag(true))
        },
        {
            type: "dialog",
            text: "Delete This Tag?",
            isVisibleSelector: state => state.tagUI.showDeleteDialog,
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: () => dispatch(editTagOnDeleteFetch())
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowDeleteDialogTag(false))
                }
            ]
        },
        {
            type: "linkItem",
            text: "Cancel",
            icon: "sign-out",
            iconFlipped: "horizontally",
            isActiveSelector: state => !isFetchingTag(state),
            linkURL: "/tags/list"
        }
    ], [id]);

    return <Tag sideMenuItems={editTagSideMenuItems} onLoad={editTagOnLoadFetch(id)} header="Tag Information" />;
};


// Basic add/edit tag page
const Tag = ({ header, sideMenuItems, onLoad }) => {
    const dispatch = useDispatch();
    const { id } = useParams();

    // On load action (also triggers when tag ids change)
    useEffect(() => {
        dispatch(onLoad);
    }, [id]);

    const loadIndicatorAndError = LoadIndicatorAndError({ fetchSelector: onLoadFetchSelector }) && <LoadIndicatorAndError fetchSelector={onLoadFetchSelector} />;
    const pageBody = loadIndicatorAndError ? loadIndicatorAndError : (
        <>
            <Header as="h1" className="add-edit-page-header">{header}</Header>
            <TagTimeStamps />
            <TagSaveError />
            <TagInput />
            <TagsEditDisplayControls />
        </>
    );
    const body = (
        <div className="tag-edit-page-container">
            {pageBody}
        </div>
    );

    return <Layout sideMenuItems={sideMenuItems} body={body} />;
};


// OnLoad fetch selector
const onLoadFetchSelector = state => state.tagUI.tagOnLoadFetch;


// Created at & modified at timestamps
const createdAtSelector = state => state.tagUI.currentTag.created_at;
const modifiedAtSelector = state => state.tagUI.currentTag.modified_at;
const isDisplayedSelector = state => state.tagUI.currentTag.tag_id > 0;
const TagTimeStamps = () => <TimeStamps createdAtSelector={createdAtSelector} modifiedAtSelector={modifiedAtSelector} isDisplayedSelector={isDisplayedSelector} />;


// Save fetch error message
const fetchSelector = state => state.tagUI.tagOnSaveFetch;
const TagSaveError = () => <SaveError fetchSelector={fetchSelector} />;


// Tag input form
const TagInput = () => {
    const dispatch = useDispatch();
    const name = useSelector(state => state.tagUI.currentTag.tag_name);
    const description = useSelector(state => state.tagUI.currentTag.tag_description);

    const nameOnChange = useRef(tag_name => {
        dispatch(setCurrentTag({ tag_name }));
    }).current;

    const descriptionOnChange = useRef(tag_description => {
        dispatch(setCurrentTag({ tag_description }));
    }).current;

    return (
        <>
            <NameInput label="Tag Name" placeholder="Tag name" value={name} onChange={nameOnChange} />
            <DescriptionEditor label="Tag Description" placeholder="Tag description" value={description} onChange={descriptionOnChange} />
        </>
    );
};
