import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { SideMenu } from "../../modules/side-menu/side-menu";
import { SideMenuItem } from "../../modules/side-menu/side-menu-item";
import { SideMenuLink } from "../../modules/side-menu/side-menu-link";
import { SideMenuDialog, SideMenuDialogButton, SideMenuDialogButtonsContainer } from "../../modules/side-menu/side-menu-dialog";

import { setShowDeleteDialogTagsEdit } from "../../../reducers/ui/tags-edit";
import { editTagOnSaveFetch, editTagOnDeleteFetch } from "../../../fetches/ui-tags-edit";
import { tagsEditNewSaveFetch } from "../../../fetches/ui/tags-edit";
import { isFetchingTag, isFetchinOrShowingDialogTag } from "../../../store/state-util/ui-tags-edit";


/**
 * /tags/edit/:id side menu for new tag page
 */
export const TagsEditNewSideMenu = () => {
    return (
        <SideMenu>
            <Save />
            <Cancel />
        </SideMenu>
    );
};


/**
 * /tags/edit/:id side menu for existing tag page
 */
export const TagsEditExistingSideMenu = () => {
    return (
        <SideMenu>
            <AddANewTag />
            <ViewTag />
            <Save />
            <Delete />
            <DeleteDialog />
            <Cancel />
        </SideMenu>
    );
};


const AddANewTag = () => {
    const isActive = useSelector(state => !isFetchingTag(state));
    return <SideMenuLink text="Add a New Tag" icon="add" iconColor="green" isActive={isActive} URL="/tags/edit/new" />;
};


const ViewTag = () => {
    const isActive = useSelector(state => !isFetchingTag(state));
    const { id } = useParams();
    const URL = `/tags/view?tagIDs=${id}`;
    return <SideMenuLink text="View Tag" icon="eye" iconColor="black" isActive={isActive} URL={URL} />;
};


const Save = () => {
    const dispatch = useDispatch();
    const isActive = useSelector(state => !isFetchingTag(state) && state.tagsEditUI.currentTag.tag_name.length >= 1 && state.tagsEditUI.currentTag.tag_name.length <= 255);
    const { id } = useParams(); // undefined for new tag page
    const onClick = useMemo(() => () => {
        const onSave = id === undefined ? tagsEditNewSaveFetch : editTagOnSaveFetch;
        dispatch(onSave());
    }, [id]);
    
    return <SideMenuItem text="Save" icon="save outline" isActive={isActive} onClick={onClick} />;
};


const Delete = () => {
    const dispatch = useDispatch();
    const isActive = useSelector(state => !isFetchinOrShowingDialogTag(state) && state.tagsEditUI.currentTag.tag_id !== 0);
    const isVisible = useSelector(state => !state.tagsEditUI.showDeleteDialog);
    const onClick = useMemo(() => () => dispatch(setShowDeleteDialogTagsEdit(true)), []);

    if (!isVisible) return null;
    return <SideMenuItem text="Delete" icon="trash alternate" iconColor="red" isActive={isActive} onClick={onClick} />;
};


const DeleteDialog = () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(state => state.tagsEditUI.showDeleteDialog);

    const yesOnClick = useMemo(() => () => dispatch(editTagOnDeleteFetch()), []);
    const noOnClick = useMemo(() => () => dispatch(setShowDeleteDialogTagsEdit(false)), []);

    if (!isVisible) return null;

    return (
        <SideMenuDialog text="Delete This Tag?">
            <SideMenuDialogButtonsContainer>
                <SideMenuDialogButton text="Yes" icon="check" color="green" onClick={yesOnClick}/>
                <SideMenuDialogButton text="No" icon="cancel" color="red" onClick={noOnClick}/>
            </SideMenuDialogButtonsContainer>
        </SideMenuDialog>
    );
};


const Cancel = () => {
    const isActive = useSelector(state => !isFetchingTag(state));
    return <SideMenuLink text="Cancel" icon="sign-out" iconFlipped="horizontally" isActive={isActive} URL="/tags/list" />;
};
