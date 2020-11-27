import React, { useEffect } from "react";
import { Header } from "semantic-ui-react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { LoadIndicatorAndError, SaveError, TimeStamps, NameDescriptionInput } from "./edit/common";
import { ObjectTypeSelector, ObjectViewEditSwitch } from "./edit/object";
import Layout from "./common/layout";

import { isFetchingObject, isFetchinOrShowingDialogObject } from "../store/state-check-functions";
import { setRedirectOnRender } from "../actions/common";
import { loadAddObjectPage, setCurrentObject, setShowDeleteDialogObject, 
    addObjectOnSaveFetch, editObjectOnLoadFetch, editObjectOnSaveFetch, editObjectOnDeleteFetch } from "../actions/object";


/*
    /objects/:id page components.
*/
// Exports
export const AddObject = () => {
    return <_Object sideMenuItems={addObjectSideMenuItems} onLoad={loadAddObjectPage()} header="Add a New Object" />;
};

export const EditObject = () => {
    const { id } = useParams();
    return <_Object sideMenuItems={editObjectSideMenuItems} onLoad={editObjectOnLoadFetch(id)} header="Object Information" />;
};

// Add object page side menu items
const addObjectSideMenuItems = [
    {
        type: "item",
        text: "Save",
        getIsActive: state => !isFetchingObject(state) && 
                                state.objectUI.currentObject.object_name.length >= 1 && state.objectUI.currentObject.object_name.length <= 255,
        onClick: addObjectOnSaveFetch()
    },
    {
        type: "item",
        text: "Cancel",
        getIsActive: state => !isFetchingObject(state),
        onClick: setRedirectOnRender("/objects")
    }
];


// Edit object page side menu items
const editObjectSideMenuItems = [
    {
        type: "item",
        text: "Save",
        getIsActive: state => !isFetchingObject(state) && 
                                state.objectUI.currentObject.object_name.length >= 1 && state.objectUI.currentObject.object_name.length <= 255,
        onClick: editObjectOnSaveFetch()
    },
    {
        type: "item",
        text: "Delete",
        getIsVisible: state => !state.objectUI.showDeleteDialog,
        getIsActive: state => !isFetchinOrShowingDialogObject(state) && state.objectUI.currentObject.object_id !== 0,
        onClick: setShowDeleteDialogObject(true)
    },
    {
        type: "dialog",
        text: "Delete this object?",
        getIsVisible: state => state.objectUI.showDeleteDialog,
        buttons: [
            {
                text: "Yes",
                onClick: editObjectOnDeleteFetch()
            },
            {
                text: "No",
                onClick: setShowDeleteDialogObject(false)
            }
        ]
    },
    {
        type: "item",
        text: "Cancel",
        getIsActive: state => !isFetchingObject(state),
        onClick: setRedirectOnRender("/objects")
    }
];


// Basic add/edit object page
const _Object = ({ header, sideMenuItems, onLoad }) => {
    const dispatch = useDispatch();
    const { id } = useParams();

    // On load action (also triggers when object ids change)
    useEffect(() => {
        dispatch(onLoad);
    }, [id]);

    const loadIndicatorAndError = LoadIndicatorAndError({ fetchSelector: onLoadFetchSelector }) && <LoadIndicatorAndError fetchSelector={onLoadFetchSelector} />;
    const pageBody = loadIndicatorAndError || (
        <>
            <Header as="h3">{header}</Header>
            <ObjectTypeSelector />
            <ObjectTimeStamps />
            <ObjectSaveError />
            <ObjectInput />
            <ObjectViewEditSwitch />
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={pageBody} />;
};


// OnLoad fetch selector
const onLoadFetchSelector = state => state.objectUI.objectOnLoadFetch;


// Created at & modified at timestamps
const createdAtSelector = state => state.objectUI.currentObject.created_at;
const modifiedAtSelector = state => state.objectUI.currentObject.modified_at;
const ObjectTimeStamps = () => <TimeStamps createdAtSelector={createdAtSelector} modifiedAtSelector={modifiedAtSelector} />;


// Save fetch error message
const fetchSelector = state => state.objectUI.objectOnSaveFetch;
const ObjectSaveError = () => <SaveError fetchSelector={fetchSelector} />;


// Object input form
const nameSelector = state => state.objectUI.currentObject.object_name;
const getNameOnChangeParams = value => ({object_name: value });
const descriptionSelector = state => state.objectUI.currentObject.object_description;
const getDescriptionOnChangeParams = value => ({object_description: value });
const ObjectInput = () => <NameDescriptionInput nameLabel="Object name" nameSelector={nameSelector} nameOnChange={setCurrentObject} getNameOnChangeParams={getNameOnChangeParams}
    descriptionLabel="Object description" descriptionSelector={descriptionSelector} descriptionOnChange={setCurrentObject} getDescriptionOnChangeParams={getDescriptionOnChangeParams} />;
