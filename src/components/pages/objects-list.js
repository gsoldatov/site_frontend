import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";

import { Layout } from "../modules/layout/layout";
import { ObjectsListFieldMenu } from "../page-parts/objects-list/field-menu";
import { TagsFilter } from "../page-parts/objects-list/tags-filter";
import { ObjectsListFieldBody } from "../page-parts/objects-list/field-body";

import { REDIRECT_ON_RENDER_PATH_CREATORS } from "../../actions/common";
import { setShowDeleteDialogObjects, setCurrentObjectsTags } from "../../actions/objects-list";
import { objectsOnLoadFetch, onDeleteFetch, onObjectsTagsUpdateFetch } from "../../fetches/ui-objects-list";
import { isFetchingObjects, isFetchingOrShowingDeleteDialogObjects, isObjectsTagsEditActive } from "../../store/state-util/ui-objects-list";


/**
 * /objects/list page component.
 */
export const ObjectsListPage = () => {
    const dispatch = useDispatch();

    // Side menu items
    const sideMenuItems = useMemo(() => [
        {
            type: "linkItem",
            text: "Add a New Object",
            icon: "add",
            iconColor: "green",
            isActiveSelector: state => !isFetchingOrShowingDeleteDialogObjects(state),
            isVisibleSelector: state => !isObjectsTagsEditActive(state),
            linkURL: "/objects/edit/new"
        },
        {
            type: "linkItem",
            text: "Edit Object",
            icon: "edit outline",
            isActiveSelector: state => state.objectsUI.selectedObjectIDs.length === 1 && !isFetchingOrShowingDeleteDialogObjects(state),
            isVisibleSelector: state => !isObjectsTagsEditActive(state),
            linkURLSelector: REDIRECT_ON_RENDER_PATH_CREATORS.objectsEdit
        },
        {
            type: "item",
            text: "Delete",
            icon: "trash alternate",
            iconColor: "red",
            isActiveSelector: state => !isFetchingOrShowingDeleteDialogObjects(state) && state.objectsUI.selectedObjectIDs.length > 0,
            isVisibleSelector: state => !state.objectsUI.showDeleteDialog && !isObjectsTagsEditActive(state),
            onClick: () => dispatch(setShowDeleteDialogObjects(true))
        },
        {
            type: "dialog",
            text: "Delete Selected Objects?",
            isVisibleSelector: state => state.objectsUI.showDeleteDialog && !isFetchingObjects(state),
            isCheckboxDisplayedSelector: state => {
                for (let objectID of state.objectsUI.selectedObjectIDs)
                    if (state.objects[objectID].object_type === "composite") return true;
                return false;
            },
            checkboxText: "Delete subobjects",
            buttons: [
                {
                    text: "Yes",
                    icon: "check",
                    color: "green",
                    onClick: deleteSubobjects => dispatch(onDeleteFetch(deleteSubobjects))
                },
                {
                    text: "No",
                    icon: "cancel",
                    color: "red",
                    onClick: () => dispatch(setShowDeleteDialogObjects(false))
                }
            ]
        },

        {
            type: "item",
            text: "Update Tags",
            icon: "check",
            iconColor: "green",
            isActiveSelector: state => !isFetchingObjects(state),
            isVisibleSelector: state => isObjectsTagsEditActive(state),
            onClick: () => dispatch(onObjectsTagsUpdateFetch())
        },
        {
            type: "item",
            text: "Cancel Tag Update",
            icon: "cancel",
            iconColor: "red",
            isActiveSelector: state => !isFetchingObjects(state),
            isVisibleSelector: state => isObjectsTagsEditActive(state),
            onClick: () => dispatch(setCurrentObjectsTags({ added: [], removed: [] }))
        }
    ]);

    // On load action
    useEffect(() => {
        dispatch(objectsOnLoadFetch());
    }, []);
    
    const body = (
        <>
            <ObjectsListFieldMenu />
            <TagsFilter />
            <ObjectsListFieldBody />
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={body} />;
};
