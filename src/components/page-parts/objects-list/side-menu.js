import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";

import { SideMenu } from "../../modules/side-menu/side-menu";
import { SideMenuItem } from "../../modules/side-menu/side-menu-item";
import { SideMenuLink } from "../../modules/side-menu/side-menu-link";
import { SideMenuDialog, SideMenuDialogCheckbox, SideMenuDialogButtonsContainer, SideMenuDialogButton } from "../../modules/side-menu/side-menu-dialog";

import { setObjectsListCurrentTags } from "../../../actions/objects-list";
import { setShowDeleteDialogObjects } from "../../../reducers/ui/objects-list";
import { objectsListDeleteFetch, objectsListUpdateTagsFetch } from "../../../fetches/ui-objects-list";
import { ObjectsListSelectors } from "../../../store/selectors/ui/objects-list";


/**
 * /objects/list page side menu.
 */
export const ObjectsListSideMenu = () => {
    return (
        <SideMenu>
            <AddANewObject />
            <EditObject />
            <Delete />
            <DeleteDialog />
            <UpdateTags />
            <CancelTagUpdate />
        </SideMenu>
    );
};


const AddANewObject = () => {
    const isActive = !(useSelector(ObjectsListSelectors.isFetchingOrShowingDeleteDialog));
    const isVisible = !(useSelector(ObjectsListSelectors.isObjectsTagsEditActive));
    
    if (!isVisible) return null;
    return <SideMenuLink text="Add a New Object" icon="add" iconColor="green" isActive={isActive} URL="/objects/edit/new" />;
};


const EditObject = () => {
    const isActive = useSelector(state => state.objectsListUI.selectedObjectIDs.length === 1 && !ObjectsListSelectors.isFetchingOrShowingDeleteDialog(state));
    const URL = useSelector(state => `/objects/edit/${state.objectsListUI.selectedObjectIDs[0]}`);
    const isVisible = !(useSelector(ObjectsListSelectors.isObjectsTagsEditActive));
    
    if (!isVisible) return null;
    return <SideMenuLink text="Edit Object" icon="edit outline" isActive={isActive} URL={URL} />;
};


const Delete = () => {
    const dispatch = useDispatch();
    const isActive = useSelector(state => !ObjectsListSelectors.isFetchingOrShowingDeleteDialog(state) && state.objectsListUI.selectedObjectIDs.length > 0);
    const isVisible = useSelector(state => !state.objectsListUI.showDeleteDialog && !ObjectsListSelectors.isObjectsTagsEditActive(state));
    const onClick = useMemo(() => () => dispatch(setShowDeleteDialogObjects(true)), []);

    if (!isVisible) return null;
    return <SideMenuItem text="Delete" icon="trash alternate" iconColor="red" isActive={isActive} onClick={onClick} />;
};


const DeleteDialog = () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(state => state.objectsListUI.showDeleteDialog && !ObjectsListSelectors.isFetching(state));
    const isCheckboxVisible = useSelector(state => state.objectsListUI.selectedObjectIDs.some(objectID => state.objects[objectID].object_type === "composite"));

    const yesOnClick = useMemo(() => deleteSubobjects => dispatch(objectsListDeleteFetch(deleteSubobjects)), []);
    const noOnClick = useMemo(() => () => dispatch(setShowDeleteDialogObjects(false)), []);

    if (!isVisible) return null;

    const checkbox = isCheckboxVisible && <SideMenuDialogCheckbox label="Delete subobjects" />;

    return (
        <SideMenuDialog text="Delete Selected Objects?">
            {checkbox}
            <SideMenuDialogButtonsContainer>
                <SideMenuDialogButton text="Yes" icon="check" color="green" onClick={yesOnClick}/>
                <SideMenuDialogButton text="No" icon="cancel" color="red" onClick={noOnClick}/>
            </SideMenuDialogButtonsContainer>
        </SideMenuDialog>
    );
};


const UpdateTags = () => {
    const dispatch = useDispatch();
    const isActive = !(useSelector(ObjectsListSelectors.isFetching));
    const isVisible = useSelector(ObjectsListSelectors.isObjectsTagsEditActive);
    const onClick = useMemo(() => () => dispatch(objectsListUpdateTagsFetch()), []);

    if (!isVisible) return null;
    return <SideMenuItem text="Update Tags" icon="check" iconColor="green" isActive={isActive} onClick={onClick} />;
};


const CancelTagUpdate = () => {
    const dispatch = useDispatch();
    const isActive = !(useSelector(ObjectsListSelectors.isFetching));
    const isVisible = useSelector(ObjectsListSelectors.isObjectsTagsEditActive);
    const onClick = useMemo(() => () => dispatch(setObjectsListCurrentTags({ added: [], removed: [] })), []);

    if (!isVisible) return null;
    return <SideMenuItem text="Cancel Tag Update" icon="cancel" iconColor="red" isActive={isActive} onClick={onClick} />;
};
