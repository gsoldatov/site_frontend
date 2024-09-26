import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { TagsEdit } from "../page-parts/tags-edit/tags-edit";

import { isFetchingTag, isFetchinOrShowingDialogTag } from "../../store/state-util/ui-tags-edit";
import { loadNewTagPage, setShowDeleteDialogTag } from "../../actions/tags-edit";
import { addTagOnSaveFetch, editTagOnLoadFetch, editTagOnSaveFetch, editTagOnDeleteFetch } from "../../fetches/ui-tags-edit";

import StyleTag from "../../styles/pages/tags-edit.css";


/**
    /objects/edit/:id page component for new tags.
*/
export const TagsEditNew = () => {
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

    return <TagsEdit sideMenuItems={addTagSideMenuItems} onLoad={loadNewTagPage()} header="Add a New Tag" />;
};


/**
    /objects/edit/:id page component for existing tags.
*/
export const TagsEditExisting = () => {
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

    return <TagsEdit sideMenuItems={editTagSideMenuItems} onLoad={editTagOnLoadFetch(id)} header="Tag Information" />;
};
