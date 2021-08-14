import React, { memo, useEffect, useMemo, useRef } from "react";
import { Header, Tab } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { createSelector } from "reselect";

import { LoadIndicatorAndError, SaveError, TimeStamps, NameDescriptionInput } from "./edit/common";
import { ObjectTypeSelector, ObjectViewEditSwitch } from "./edit/object";
import Layout from "./common/layout";
import { InlineItemListBlock, InlineItemListWrapper } from "./inline/inline-item-list-containers";
import { InlineItemList } from "./inline/inline-item-list";
import { InlineItem } from "./inline/inline-item";
import { InlineInput } from "./inline/inline-input";

import { getCurrentObject, isFetchingObject, isFetchingOrOnLoadFetchFailed } from "../store/state-util/ui-object";
import { resetEditedObjects, setEditedObject, setEditedObjectTags, setSelectedTab, setObjectTagsInput, 
         setShowResetDialogObject, setShowDeleteDialogObject, clearUnsavedCurrentEditedObject } from "../actions/object";
import { addObjectOnLoad, addObjectOnSaveFetch, editObjectOnLoadFetch, editObjectOnSaveFetch, editObjectOnDeleteFetch, objectTagsDropdownFetch } from "../fetches/ui-object";


/*
    /objects/edited page components.
*/
export const EditedObjects = () => {
    const pageBody = <div>Edited objects page</div>;
    
    return <Layout body={pageBody} />;
    // const dispatch = useDispatch();

    // const objectType = useSelector(state => getCurrentObject(state).object_type);
    // const selectedTab = useSelector(state => state.objectUI.selectedTab);

    // // On load action (also triggers when object ids change)
    // useEffect(() => {
    //     dispatch(onLoad);
    // }, [objectID]);

    // const navigationBarItemOnClickcallback = useMemo(() => () => dispatch(clearUnsavedCurrentEditedObject()));

    // const loadIndicatorAndError = LoadIndicatorAndError({ fetchSelector: onLoadFetchSelector }) && <LoadIndicatorAndError fetchSelector={onLoadFetchSelector} />;
    // const pageBody = loadIndicatorAndError || (
    //     <>
    //         <Header as="h1">{header}</Header>
    //         <ObjectSaveError />
    //         <ObjectTabPanes objectID={objectID} />
    //     </>
    // );

    // // Custom layout classname for composite objects (to allow multicolumn subobjects)
    // const className = objectType === "composite" && selectedTab === 1 ? "composite-object-page" : undefined;

    // return <Layout sideMenuItems={sideMenuItems} body={pageBody} className={className} navigationBarItemOnClickcallback={navigationBarItemOnClickcallback} />;
}
