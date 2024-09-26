import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import Layout from "../common/layout";
import { TagsListFieldMenu } from "../page-parts/tags-list/field-menu";

import { REDIRECT_ON_RENDER_PATH_CREATORS } from "../../actions/common";
import { setShowDeleteDialogTags } from "../../actions/tags-list";
import { onDeleteFetch } from "../../fetches/ui-tags-list";
import { isFetchingTags, isFetchinOrShowingDialogTags } from "../../store/state-util/ui-tags-list";

import { enumUserLevels } from "../../util/enum-user-levels";
import { TagsListFieldBody } from "../page-parts/tags-list/field-body";



/**
 * /tags/list page component.
 */
export const TagsListPage = () => {
    const dispatch = useDispatch();
    const isLoggedIn = useSelector(state => state.auth.numeric_user_level > enumUserLevels.anonymous);

    // Side menu items
    const sideMenuItems = useMemo(() => isLoggedIn ? [
        {
            type: "linkItem",
            text: "Add a New Tag",
            icon: "add",
            iconColor: "green",
            isActiveSelector: state => !isFetchinOrShowingDialogTags(state),
            linkURL: "/tags/edit/new"
        },
        {
            type: "linkItem",
            text: "Edit Tag",
            icon: "edit outline",
            isActiveSelector: state => state.tagsUI.selectedTagIDs.length === 1 && !isFetchinOrShowingDialogTags(state),
            linkURLSelector: REDIRECT_ON_RENDER_PATH_CREATORS.tagsEdit
        },
        {
            type: "item",
            text: "Delete",
            icon: "trash alternate",
            iconColor: "red",
            isActiveSelector: state => !isFetchinOrShowingDialogTags(state) && state.tagsUI.selectedTagIDs.length > 0,
            isVisibleSelector: state => !state.tagsUI.showDeleteDialog,
            onClick: () => dispatch(setShowDeleteDialogTags(true))
        },
        {
            type: "dialog",
            text: "Delete Selected Tags?",
            isVisibleSelector: state => state.tagsUI.showDeleteDialog && !isFetchingTags(state),
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: () => dispatch(onDeleteFetch())
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowDeleteDialogTags(false))
                }
            ]
        }
    ] : []
    , [isLoggedIn]);
    
    const body = (
        <>
            <TagsListFieldMenu />
            <TagsListFieldBody />
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={body} />;
};
