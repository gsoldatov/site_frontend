import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { SideMenu } from "../../modules/side-menu/side-menu";
import { SideMenuItem } from "../../modules/side-menu/side-menu-item";
import { SideMenuLink } from "../../modules/side-menu/side-menu-link";
import { SideMenuDialog, SideMenuDialogButtonsContainer, SideMenuDialogButton } from "../../modules/side-menu/side-menu-dialog";

import { setShowDeleteDialogTags } from "../../../actions/tags-list";
import { onDeleteFetch } from "../../../fetches/ui-tags-list";
import { isFetchingTags, isFetchinOrShowingDialogTags } from "../../../store/state-util/ui-tags-list";

import { enumUserLevels } from "../../../util/enums/enum-user-levels";


/**
 * /tags/list page side menu.
 */
export const TagsListSideMenu = () => {
    // const dispatch = useDispatch();
    const isLoggedIn = useSelector(state => state.auth.numeric_user_level > enumUserLevels.anonymous);

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
    const isActive = useSelector(state => !isFetchinOrShowingDialogTags(state));
    return <SideMenuLink text="Add a New Tag" icon="add" iconColor="green" isActive={isActive} URL="/tags/edit/new" />;
};


const EditTag = () => {
    const isActive = useSelector(state => state.tagsUI.selectedTagIDs.length === 1 && !isFetchinOrShowingDialogTags(state));
    const URL = useSelector(state => `/tags/edit/${state.tagsUI.selectedTagIDs[0]}`);
    return <SideMenuLink text="Edit Tag" icon="edit outline" isActive={isActive} URL={URL} />;
};


const Delete = () => {
    const dispatch = useDispatch();
    const isActive = useSelector(state => !isFetchinOrShowingDialogTags(state) && state.tagsUI.selectedTagIDs.length > 0);
    const isVisible = useSelector(state => !state.tagsUI.showDeleteDialog);
    const onClick = useMemo(() => () => dispatch(setShowDeleteDialogTags(true)), []);

    if (!isVisible) return null;

    return <SideMenuItem text="Delete" icon="trash alternate" iconColor="red" isActive={isActive} onClick={onClick} />;
};


const DeleteDialog = () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(state => state.tagsUI.showDeleteDialog && !isFetchingTags(state));

    const yesOnClick = useMemo(() => () => dispatch(onDeleteFetch()), []);
    const noOnClick = useMemo(() => () => dispatch(setShowDeleteDialogTags(false)), []);

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
