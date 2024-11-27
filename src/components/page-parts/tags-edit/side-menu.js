import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { SideMenu } from "../../modules/side-menu/side-menu";
import { SideMenuItem } from "../../modules/side-menu/side-menu-item";
import { SideMenuLink } from "../../modules/side-menu/side-menu-link";
import { SideMenuDialog, SideMenuDialogButton, SideMenuDialogButtonsContainer } from "../../modules/side-menu/side-menu-dialog";

import { setTagsEditShowDeleteDialog } from "../../../reducers/ui/tags-edit";
import { tagsEditExistingSaveFetch, tagsEditNewSaveFetch, tagsEditExistingDeleteFetch } from "../../../fetches/ui/tags-edit";
import { TagsEditSelectors } from "../../../store/selectors/ui/tags-edit";


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
    const isActive = !(useSelector(TagsEditSelectors.isFetching));
    return <SideMenuLink text="Add a New Tag" icon="add" iconColor="green" isActive={isActive} URL="/tags/edit/new" />;
};


const ViewTag = () => {
    const isActive = !(useSelector(TagsEditSelectors.isFetching));
    const { id } = useParams();
    const URL = `/tags/view?tagIDs=${id}`;
    return <SideMenuLink text="View Tag" icon="eye" iconColor="black" isActive={isActive} URL={URL} />;
};


const Save = () => {
    const dispatch = useDispatch();
    const isActive = useSelector(state => !TagsEditSelectors.isFetchingOrLoadFailed(state));
    const { id } = useParams(); // undefined for new tag page
    const onClick = useMemo(() => () => {
        const onSave = id === undefined ? tagsEditNewSaveFetch : tagsEditExistingSaveFetch;
        dispatch(onSave());
    }, [id]);
    
    return <SideMenuItem text="Save" icon="save outline" isActive={isActive} onClick={onClick} />;
};


const Delete = () => {
    const dispatch = useDispatch();
    const isActive = useSelector(state => !TagsEditSelectors.isFetchinOrShowingDialog(state) && state.tagsEditUI.currentTag.tag_id !== 0);
    const isVisible = useSelector(state => !state.tagsEditUI.showDeleteDialog);
    const onClick = useMemo(() => () => dispatch(setTagsEditShowDeleteDialog(true)), []);

    if (!isVisible) return null;
    return <SideMenuItem text="Delete" icon="trash alternate" iconColor="red" isActive={isActive} onClick={onClick} />;
};


const DeleteDialog = () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(state => state.tagsEditUI.showDeleteDialog);

    const yesOnClick = useMemo(() => () => dispatch(tagsEditExistingDeleteFetch()), []);
    const noOnClick = useMemo(() => () => dispatch(setTagsEditShowDeleteDialog(false)), []);

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
    const isActive = !(useSelector(TagsEditSelectors.isFetching));
    return <SideMenuLink text="Cancel" icon="sign-out" iconFlipped="horizontally" isActive={isActive} URL="/tags/list" />;
};
