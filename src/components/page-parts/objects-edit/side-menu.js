import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { SideMenu } from "../../modules/side-menu/side-menu";
import { SideMenuItem } from "../../modules/side-menu/side-menu-item";
import { SideMenuLink } from "../../modules/side-menu/side-menu-link";
import { SideMenuDialog, SideMenuDialogButton, SideMenuDialogButtonsContainer, SideMenuDialogCheckbox } from "../../modules/side-menu/side-menu-dialog";

import { getCurrentObject, isFetchingObject, isFetchingOrOnLoadFetchFailed } from "../../../store/state-util/ui-objects-edit";
import { isMultiColumnCompositeDataDisplayed } from "../../../store/state-util/composite";
import { resetEditedObjects, setShowResetDialogObject, setShowDeleteDialogObject, setToDoListRerenderPending } from "../../../actions/objects-edit";
import { addObjectOnSaveFetch, editObjectOnSaveFetch, editObjectOnDeleteFetch } from "../../../fetches/ui-objects-edit";


/**
 * /objects/edit/:id side menu for new object page
 */
export const ObjectsEditNewSideMenu = () => {
    const usePlaceholderWhenStacked = useSelector(isMultiColumnCompositeDataDisplayed);

    return (
        <SideMenu usePlaceholderWhenStacked={usePlaceholderWhenStacked}>
            <Save />
            <Reset />
            <ResetDialog />
            <Cancel />
        </SideMenu>
    );
};


/**
 * /objects/edit/:id side menu for existing object page
 */
export const ObjectsEditExistingSideMenu = () => {
    const usePlaceholderWhenStacked = useSelector(isMultiColumnCompositeDataDisplayed);

    return (
        <SideMenu usePlaceholderWhenStacked={usePlaceholderWhenStacked}>
            <AddANewObject />
            <ViewObject />
            <Save />
            <Reset />
            <ResetDialog />
            <Delete />
            <DeleteDialog />
            <Cancel />
        </SideMenu>
    );
};


const AddANewObject = () => {
    const isActive = useSelector(state => !isFetchingObject(state));
    return <SideMenuLink text="Add a New Object" icon="add" iconColor="green" isActive={isActive} URL="/objects/edit/new" />;
};


const ViewObject = () => {
    const isActive = useSelector(state => !isFetchingObject(state));
    const { id } = useParams();
    const URL = `/objects/view/${id}`;
    return <SideMenuLink text="View Object" icon="eye" iconColor="black" isActive={isActive} URL={URL} />;
};


const Save = () => {
    const dispatch = useDispatch();
    const isActive = useSelector(state => 
        !isFetchingObject(state) && getCurrentObject(state).object_name.length >= 1 && getCurrentObject(state).object_name.length <= 255);
    const { id } = useParams(); // undefined for new object page
    const onClick = useMemo(() => () => {
        const onSave = id === undefined ? addObjectOnSaveFetch : editObjectOnSaveFetch;
        dispatch(onSave());
    }, [id]);
    
    return <SideMenuItem text="Save" icon="save outline" isActive={isActive} onClick={onClick} />;
};


const Reset = () => {
    const dispatch = useDispatch();
    const { id } = useParams(); // undefined for new object page
    const isActive = useSelector(state => id === undefined
        ? !isFetchingObject(state)
        : !isFetchingOrOnLoadFetchFailed(state)
    );
    const isVisible = useSelector(state => !state.objectsEditUI.showResetDialog);
    const onClick = useMemo(() => () => dispatch(setShowResetDialogObject(true)), []);

    if (!isVisible) return null;    
    return <SideMenuItem text="Reset" icon="undo" isActive={isActive} onClick={onClick} />;
};


const ResetDialog = () => {
    const dispatch = useDispatch();
    const { id } = useParams(); // undefined for new object page
    const isVisible = useSelector(state => state.objectsEditUI.showResetDialog);
    const isCheckboxVisible = useSelector(state => getCurrentObject(state).object_type === "composite");

    const yesOnClick = useMemo(() => resetCompositeSubobjects => {
        let params = { hideObjectResetDialog: true, resetCompositeSubobjects };
        if (id === undefined) params = { ...params, allowResetToDefaults: true, defaultDisplayInFeed: true };
        dispatch(resetEditedObjects(params));
        dispatch(setToDoListRerenderPending(true)); // toggle rerender of content editable inputs with reset values
    }, [id]);
    const noOnClick = useMemo(() => () => dispatch(setShowResetDialogObject(false)), []);

    if (!isVisible) return null;

    const checkbox = isCheckboxVisible && <SideMenuDialogCheckbox label="Reset subobjects" />;

    return (
        <SideMenuDialog text="Reset This Object?">
            {checkbox}
            <SideMenuDialogButtonsContainer>
                <SideMenuDialogButton text="Yes" icon="check" color="green" onClick={yesOnClick}/>
                <SideMenuDialogButton text="No" icon="cancel" color="red" onClick={noOnClick}/>
            </SideMenuDialogButtonsContainer>
        </SideMenuDialog>
    );
};


const Delete = () => {
    const dispatch = useDispatch();
    const isActive = useSelector(state => !isFetchingOrOnLoadFetchFailed(state));
    const isVisible = useSelector(state => !state.objectsEditUI.showDeleteDialog);
    const onClick = useMemo(() => () => dispatch(setShowDeleteDialogObject(true)), []);

    if (!isVisible) return null;
    return <SideMenuItem text="Delete" icon="trash alternate" iconColor="red" isActive={isActive} onClick={onClick} />;
};


const DeleteDialog = () => {
    const dispatch = useDispatch();
    const isVisible = useSelector(state => state.objectsEditUI.showDeleteDialog);
    const isCheckboxVisible = useSelector(state => getCurrentObject(state).object_type === "composite");

    const yesOnClick = useMemo(() => deleteSubobjects => dispatch(editObjectOnDeleteFetch(deleteSubobjects)), []);
    const noOnClick = useMemo(() => () => dispatch(setShowDeleteDialogObject(false)), []);

    if (!isVisible) return null;

    const checkbox = isCheckboxVisible && <SideMenuDialogCheckbox label="Delete subobjects" />;

    return (
        <SideMenuDialog text="Delete This Object?">
            {checkbox}
            <SideMenuDialogButtonsContainer>
                <SideMenuDialogButton text="Yes" icon="check" color="green" onClick={yesOnClick}/>
                <SideMenuDialogButton text="No" icon="cancel" color="red" onClick={noOnClick}/>
            </SideMenuDialogButtonsContainer>
        </SideMenuDialog>
    );
};


const Cancel = () => {
    const isActive = useSelector(state => !isFetchingObject(state));
    return <SideMenuLink text="Cancel" icon="sign-out" iconFlipped="horizontally" isActive={isActive} URL="/objects/list" />;
};
