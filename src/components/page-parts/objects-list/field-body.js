import React, { memo, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import { ErrorMessage } from "../../modules/error-message";
import { SelectedObjectsTags } from "./selected-objects-tags";
import { FieldItemList, FieldItem } from "../../modules/field-item-list";
import { ExpandableContainer } from "../../modules/expandable-container";
import { ObjectsListPagination } from "./objects-list-pagination";

import { toggleObjectSelection } from "../../../reducers/ui/objects-list";
import { objectsListOnLoadFetch } from "../../../fetches/ui-objects-list";


/**
 * /objects/list field body.
 */
export const ObjectsListFieldBody = () => {
    const dispatch = useDispatch();
    const { isFetching, fetchError } = useSelector(state => state.objectsListUI.fetch);

    // On load action
    useEffect(() => {
        dispatch(objectsListOnLoadFetch());
    }, []);

    if (isFetching) return <Loader active inline="centered">Loading tags...</Loader>;
    if (fetchError) return  <ErrorMessage text={fetchError}/>;

    return (
        <>
        <SelectedObjectsTags />
        <SelectedObjects />
        <PageObjects />
        <ObjectsListPagination />
        </>
    );
};


/**
 * Selected objects field item list.
 */
const SelectedObjects = () => {
    const itemIDs = useSelector(state => state.objectsListUI.selectedObjectIDs);

    return (    // 67px = header + 1 line with borders
        <ExpandableContainer maxCollapsedHeight={67}>
            <FieldItemList header="Selected Objects" itemIDs={itemIDs} ItemComponent={ObjectsFieldItem} />
        </ExpandableContainer>
    );
};


/**
 * Current page objects field item list.
 */
const PageObjects = () => {
    const itemIDs = useSelector(state => state.objectsListUI.paginationInfo.currentPageObjectIDs);
    return <FieldItemList itemIDs={itemIDs} ItemComponent={ObjectsFieldItem} />;
};


/**
 * <FieldItem> wrapper component for /objects/list page.
 */
const ObjectsFieldItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => state.objects[id] ? state.objects[id].object_name : "?");
    const URL = `/objects/view/${id}`;
    const onChange = useMemo(() => () => dispatch(toggleObjectSelection(id)), [id]);
    const isChecked = useSelector(state => state.objectsListUI.selectedObjectIDs.includes(id));
    
    return <FieldItem text={text} URL={URL} onChange={onChange} isChecked={isChecked} />;
});
