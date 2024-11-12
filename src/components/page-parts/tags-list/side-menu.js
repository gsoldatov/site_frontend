import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { SideMenu } from "../../modules/side-menu/side-menu";
import { SideMenuItem } from "../../modules/side-menu/side-menu-item";
import { SideMenuLink } from "../../modules/side-menu/side-menu-link";
import { SideMenuDialog, SideMenuDialogButtonsContainer, SideMenuDialogButton } from "../../modules/side-menu/side-menu-dialog";

import { setTagsListShowDeleteDialog } from "../../../reducers/ui/tags-list";
import { tagsListDeleteFetch } from "../../../fetches/ui/tags-list";
import { TagsListSelectors } from "../../../store/selectors/ui/tags-list";

import { NumericUserLevel } from "../../../store/types/data/auth";

/**
 * /tags/list page side menu.
 */
export const TagsListSideMenu = () => {
    // const dispatch = useDispatch();
    const isLoggedIn = useSelector(state => state.auth.numeric_user_level > NumericUserLevel.anonymous);

    // Render an empty side menu to keep side menu column in layout
    if (!isLoggedIn) return <SideMenu />;

    return (
        <SideMenu>
            <AddANewTag />
            <EditTag />
            <Delete />
            <DeleteDialog />
        </SideMenu>
    );
};


const AddANewTag = () => {
    const isActive = !(useSelector(TagsListSelectors.isFetchinOrShowingDialog));
    return <SideMenuLink text="Add a New Tag" icon="add" iconColor="green" isActive={isActive} URL="/tags/edit/new" />;
};


const EditTag = () => {
    const isActive = useSelector(state => state.tagsListUI.selectedTagIDs.length === 1 && !TagsListSelectors.isFetchinOrShowingDialog(state));
    const URL = useSelector(state => `/tags/edit/${state.tagsListUI.selectedTagIDs[0]}`);
    return <SideMenuLink text="Edit Tag" icon="edit outline" isActive={isActive} URL={URL} />;
};


const Delete = () => {
    const dispatch = useDispatch();
    const isActive = useSelector(state => !TagsListSelectors.isFetchinOrShowingDialog(state) && state.tagsListUI.selectedTagIDs.length > 0);
    const isVisible = useSelector(state => !state.tagsListUI.showDeleteDialog);
    const onClick = useMemo(() => () => dispatch(setTagsListShowDeleteDialog(true)), []);

    if (!isVisible) return null;

    return <SideMenuItem text="Delete" icon="trash alternate" iconColor="red" isActive={isActive} onClick={onClick} />;
};


const DeleteDialog = () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(state => state.tagsListUI.showDeleteDialog && !TagsListSelectors.isFetching(state));

    const yesOnClick = useMemo(() => () => dispatch(tagsListDeleteFetch()), []);
    const noOnClick = useMemo(() => () => dispatch(setTagsListShowDeleteDialog(false)), []);

    if (!isVisible) return null;

    return (
        <SideMenuDialog text="Delete Selected Tags?">
            <SideMenuDialogButtonsContainer>
                <SideMenuDialogButton text="Yes" icon="check" color="green" onClick={yesOnClick}/>
                <SideMenuDialogButton text="No" icon="cancel" color="red" onClick={noOnClick}/>
            </SideMenuDialogButtonsContainer>
        </SideMenuDialog>
    );
};
