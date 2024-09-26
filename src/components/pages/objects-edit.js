import React, { memo, useEffect, useMemo, useRef } from "react";
import { Header, Tab } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { createSelector } from "reselect";

import { LoadIndicatorAndError, SaveError, TimeStamps, NameInput, DescriptionEditor } from "../edit/common/edit-page";
import { ObjectTypeSelector, ObjectViewEditSwitch } from "../edit/objects-edit";
import { DisplayTab } from "../edit/objects-edit-display-controls/display-tab";
import Layout from "../common/layout";
import { InlineItemListBlock, InlineItemListWrapper } from "../inline/inline-item-list-containers";
import { InlineItemList } from "../inline/inline-item-list";
import { InlineItem } from "../inline/inline-item";
import { InlineInput } from "../inline/inline-input";

import { getCurrentObject, isFetchingObject, isFetchingOrOnLoadFetchFailed } from "../../store/state-util/ui-objects-edit";
import { resetEditedObjects, setEditedObject, setEditedObjectTags, setSelectedTab, setObjectTagsInput, 
         setShowResetDialogObject, setShowDeleteDialogObject } from "../../actions/objects-edit";
import { addObjectOnLoad, addObjectOnSaveFetch, editObjectOnLoadFetch, editObjectOnSaveFetch, editObjectOnDeleteFetch, objectTagsDropdownFetch } from "../../fetches/ui-objects-edit";

import { isMultiColumnCompositeDataDisplayed } from "../../store/state-util/composite";
import { enumLayoutTypes } from "../../util/enum-layout-types";
import { ObjectsEdit } from "../page-parts/objects-edit/objects-edit";


/**
    /objects/edit/:id page component for new objects
*/
export const ObjectsEditNew = () => {
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
export const ObjectsEditExisting = () => {
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
