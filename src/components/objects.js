import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import Layout from "./common/layout";
import Error from "./common/error";
import FieldMenu from "./field/field-menu";
import { FieldItemList, FieldItem } from "./field/field-item-list";
import FieldPagination from "./field/field-pagination";

import { REDIRECT_ON_RENDER_PATH_CREATORS, setRedirectOnRender } from "../actions/common";
import { selectObjects, clearSelectedObjects, pageFetch, setObjectsPaginationInfo, setObjectsPaginationInfoAndFetchPage,
    setShowDeleteDialogObjects, toggleObjectSelection, onDeleteFetch } from "../actions/objects";
import { isFetchingObjects, isFetchinOrShowingDialogObjects } from "../store/state-check-functions";


/* /objects page component */
export default () => {
    const dispatch = useDispatch();
    const currentPage = useSelector(state => state.objectsUI.paginationInfo.currentPage);
    const fetch = useSelector(state => state.objectsUI.fetch);

    // On load action
    useEffect(() => {
        dispatch(pageFetch(currentPage));
    }, []);

    const loader = fetch.isFetching && <Loader active inline="centered">Loading objects...</Loader>;
    const error = !fetch.isFetching && fetch.fetchError && <Error text={fetch.fetchError}/>;
    const pageBody = loader || error || (
        <>
        <FieldItemList header="Selected Objects" itemIDsSelector={selectedObjectIDsSelector} ItemComponent={ObjectsFieldItem} isExpandable />
        <FieldItemList itemIDsSelector={pageObjectIDsSelector} ItemComponent={ObjectsFieldItem} />
        <FieldPagination paginationInfoSelector={paginationInfoSelector} setCurrentPage={pageFetch} />
        </>
    );
    const pageBodyWithMenu = (
        <>
        <FieldMenu items={fieldMenuItems} />
        {pageBody}
        </>
    );

    return <Layout sideMenuItems={sideMenuItems} body={pageBodyWithMenu} />;
};


// Side menu items
const sideMenuItems = [
    {
        type: "item",
        text: "Add Object",
        getIsActive: state => !isFetchinOrShowingDialogObjects(state),
        onClick: setRedirectOnRender("/objects/add")
    },
    {
        type: "item",
        text: "Edit Object",
        getIsActive: state => state.objectsUI.selectedObjectIDs.length === 1 && !isFetchinOrShowingDialogObjects(state),
        onClick: setRedirectOnRender(REDIRECT_ON_RENDER_PATH_CREATORS.objectsEdit)
    },
    {
        type: "item",
        text: "Delete",
        getIsActive: state => !isFetchinOrShowingDialogObjects(state) && state.objectsUI.selectedObjectIDs.length > 0,
        getIsVisible: state => !state.objectsUI.showDeleteDialog,
        onClick: setShowDeleteDialogObjects(true)
    },
    {
        type: "dialog",
        text: "Delete selected objects?",
        getIsVisible: state => state.objectsUI.showDeleteDialog && !isFetchingObjects(state),
        buttons: [
            {
                text: "Yes",
                onClick: onDeleteFetch()
            },
            {
                text: "No",
                onClick: setShowDeleteDialogObjects(false)
            }
        ]
    }
];


// Field menu items
const fieldMenuItems = [
    {
        type: "itemGroup",
        items: [
            {
                type: "item",
                icon: "check",
                title: "Select all objects on page",
                onClick: objectIDs => selectObjects(objectIDs),
                getOnClickParams: state => state.objectsUI.paginationInfo.currentPageObjectIDs,
                getIsDisabled: state => isFetchingObjects(state)
            },
            {
                type: "item",
                icon: "cancel",
                title: "Deselect all objects",
                onClick: clearSelectedObjects(),
                getIsDisabled: state => isFetchingObjects(state)
            }
        ]
    },
    {
        type: "itemGroup",
        items: [
            {
                type: "item",
                icon: "sort content descending",
                title: "Sort in ascending order",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "asc" },
                getIsDisabled: state => isFetchingObjects(state),
                getIsActive: state => state.objectsUI.paginationInfo.sortOrder === "asc"
            },
            {
                type: "item",
                icon: "sort content ascending",
                title: "Sort in descending order",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortOrder: "desc" },
                getIsDisabled: state => isFetchingObjects(state),
                getIsActive: state => state.objectsUI.paginationInfo.sortOrder === "desc"
            }
        ]
    },
    {
        type: "itemGroup",
        // noBorder: true,
        items: [
            {
                type: "item",
                icon: "font",
                title: "Sort by object name",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "object_name" },
                getIsDisabled: state => isFetchingObjects(state),
                getIsActive: state => state.objectsUI.paginationInfo.sortField === "object_name"
            },
            {
                type: "item",
                icon: "clock outline",
                title: "Sort by modify time",
                onClick: params => setObjectsPaginationInfoAndFetchPage(params),
                onClickParams: { sortField: "modified_at" },
                getIsDisabled: state => isFetchingObjects(state),
                getIsActive: state => state.objectsUI.paginationInfo.sortField === "modified_at"
            }
        ]
    },
    {
        type: "filter",
        disabledSelector: state => isFetchingObjects(state),
        placeholder: "Filter objects",
        getValueSelector: state => state.objectsUI.paginationInfo.filterText,
        onChange: params => setObjectsPaginationInfo(params),    // action for updating input input text (which is kept in state)
        onChangeDelayed: params => setObjectsPaginationInfoAndFetchPage(params),     // action for performing a fetch with a delay from the last onChange event
        getOnChangeParams: text => ({ filterText: text })
    }
];


// Immutable selectors
const selectedObjectIDsSelector = state => state.objectsUI.selectedObjectIDs;
const pageObjectIDsSelector = state => state.objectsUI.paginationInfo.currentPageObjectIDs;
const paginationInfoSelector = state => state.objectsUI.paginationInfo;


// FieldItem creating component for /objects page
const ObjectsFieldItem = ({ id }) => {
    const textSelector = useRef(state => state.objects[id] ? state.objects[id].object_name : "?").current;
    const isCheckedSelector = useRef(state => state.objectsUI.selectedObjectIDs.includes(id)).current;
    const link = useRef(`/objects/${id}`).current;
    return <FieldItem id={id} textSelector={textSelector} link={link} 
    isCheckedSelector={isCheckedSelector} onChange={toggleObjectSelection} />;
};
