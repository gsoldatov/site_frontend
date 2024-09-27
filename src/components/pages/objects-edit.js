import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { ObjectsEdit } from "../page-parts/objects-edit/objects-edit";

import { getCurrentObject, isFetchingObject, isFetchingOrOnLoadFetchFailed } from "../../store/state-util/ui-objects-edit";
import { resetEditedObjects, setShowResetDialogObject, setShowDeleteDialogObject } from "../../actions/objects-edit";
import { addObjectOnLoad, addObjectOnSaveFetch, editObjectOnLoadFetch, editObjectOnSaveFetch, editObjectOnDeleteFetch } from "../../fetches/ui-objects-edit";


/**
    /objects/edit/:id page component for new objects
*/
export const ObjectsEditNewPage = () => {
    const dispatch = useDispatch();

    const addObjectSideMenuItems = useMemo(() => [
        {
            type: "item",
            text: "Save",
            icon: "save outline",
            isActiveSelector: state => !isFetchingObject(state) && 
                                    getCurrentObject(state).object_name.length >= 1 && getCurrentObject(state).object_name.length <= 255,
            onClick: () => dispatch(addObjectOnSaveFetch())
        },

        {
            type: "item",
            text: "Reset",
            icon: "undo",
            isVisibleSelector: state => !state.objectUI.showResetDialog,
            isActiveSelector: state => !isFetchingObject(state),
            onClick: () => dispatch(setShowResetDialogObject(true))
        },
        {
            type: "dialog",
            text: "Reset This Object?",
            isVisibleSelector: state => state.objectUI.showResetDialog,
            isCheckboxDisplayedSelector: state => getCurrentObject(state).object_type === "composite", 
            checkboxText: "Reset subobjects",
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: resetCompositeSubobjects => dispatch(resetEditedObjects({ hideObjectResetDialog: true, allowResetToDefaults: true, 
                        defaultDisplayInFeed: true, resetCompositeSubobjects }))
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowResetDialogObject(false))
                }
            ]
        },

        {
            type: "linkItem",
            text: "Cancel",
            icon: "sign-out",
            iconFlipped: "horizontally",
            isActiveSelector: state => !isFetchingObject(state),
            linkURL: "/objects/list"
        }
    ]);

    const id = 0;
    return <ObjectsEdit sideMenuItems={addObjectSideMenuItems} objectID={id} onLoad={addObjectOnLoad()} header="Add a New Object" />;
};


/**
    /objects/edit/:id page component for existing objects
*/
export const ObjectsEditExistingPage = () => {
    const dispatch = useDispatch();
    let { id } = useParams();
    id = parseInt(id);

    const editObjectSideMenuItems = useMemo(() => [
        {
            type: "linkItem",
            text: "Add a New Object",
            icon: "add",
            iconColor: "green",
            isActiveSelector: state => !isFetchingObject(state),
            linkURL: "/objects/edit/new"
        },

        {
            type: "linkItem",
            text: "View Object",
            icon: "eye",
            iconColor: "black",
            isActiveSelector: state => !isFetchingObject(state),
            linkURL: `/objects/view/${id}`
        },

        {
            type: "item",
            text: "Save",
            icon: "save outline",
            isActiveSelector: state => !isFetchingObject(state) && 
                                    getCurrentObject(state).object_name.length >= 1 && getCurrentObject(state).object_name.length <= 255,
            onClick: () => dispatch(editObjectOnSaveFetch())
        },

        {
            type: "item",
            text: "Reset",
            icon: "undo",
            isVisibleSelector: state => !state.objectUI.showResetDialog,
            isActiveSelector: state => !isFetchingOrOnLoadFetchFailed(state),
            onClick: () => dispatch(setShowResetDialogObject(true))
        },
        {
            type: "dialog",
            text: "Reset This Object?",
            isVisibleSelector: state => state.objectUI.showResetDialog,
            isCheckboxDisplayedSelector: state => getCurrentObject(state).object_type === "composite", 
            checkboxText: "Reset subobjects",
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: resetCompositeSubobjects => dispatch(resetEditedObjects({ hideObjectResetDialog: true, resetCompositeSubobjects }))
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowResetDialogObject(false))
                }
            ]
        },
        
        {
            type: "item",
            text: "Delete",
            icon: "trash alternate",
            iconColor: "red",
            isVisibleSelector: state => !state.objectUI.showDeleteDialog,
            isActiveSelector: state => !isFetchingOrOnLoadFetchFailed(state),
            onClick: () => dispatch(setShowDeleteDialogObject(true))
        },
        {
            type: "dialog",
            text: "Delete This Object?",
            isVisibleSelector: state => state.objectUI.showDeleteDialog,
            isCheckboxDisplayedSelector: state => getCurrentObject(state).object_type === "composite", 
            checkboxText: "Delete subobjects",
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: deleteSubobjects => dispatch(editObjectOnDeleteFetch(deleteSubobjects))
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowDeleteDialogObject(false))
                }
            ]
        },

        {
            type: "linkItem",
            text: "Cancel",
            icon: "sign-out",
            iconFlipped: "horizontally",
            isActiveSelector: state => !isFetchingObject(state),
            linkURL: "/objects/list"
        }
    ], [id]);

    return <ObjectsEdit sideMenuItems={editObjectSideMenuItems} objectID={id} onLoad={editObjectOnLoadFetch(id)} header="Object Information" />;
};
