import React, { memo, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "semantic-ui-react";

import { ErrorMessage } from "../../modules/error-message";
import { SelectedObjectsTags } from "./selected-objects-tags";
import { FieldItemList, FieldItem } from "../../modules/field/field-item-list";
import { FieldPagination } from "../../modules/field/field-pagination";

import { toggleObjectSelection } from "../../../actions/objects-list";
import { objectsOnLoadFetch, pageFetch } from "../../../fetches/ui-objects-list";


/**
 * /objects/list field body.
 */
export const ObjectsListFieldBody = () => {
    const dispatch = useDispatch();
    const { isFetching, fetchError } = useSelector(state => state.objectsUI.fetch);

    // Selectors
    const selectedObjectIDsSelector = useMemo(() => state => state.objectsUI.selectedObjectIDs, []);
    const pageObjectIDsSelector = useMemo(() => state => state.objectsUI.paginationInfo.currentPageObjectIDs, []);
    const paginationInfoSelector = useMemo(() => state => state.objectsUI.paginationInfo, []);

    // On load action
    useEffect(() => {
        dispatch(objectsOnLoadFetch());
    }, []);

    if (isFetching) return <Loader active inline="centered">Loading tags...</Loader>;
    if (fetchError) return  <ErrorMessage text={fetchError}/>;

    return (
        <>
        <SelectedObjectsTags />
        <FieldItemList header="Selected Objects" itemIDsSelector={selectedObjectIDsSelector} ItemComponent={ObjectsFieldItem} isExpandable />
        <FieldItemList itemIDsSelector={pageObjectIDsSelector} ItemComponent={ObjectsFieldItem} />
        <FieldPagination paginationInfoSelector={paginationInfoSelector} setCurrentPage={pageFetch} />
        </>
    );
};


/**
 * <FieldItem> wrapper component for /objects/list page.
 */
const ObjectsFieldItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => state.objects[id] ? state.objects[id].object_name : "?");
    const URL = `/objects/view/${id}`;
    const onChange = useMemo(() => () => dispatch(toggleObjectSelection(id)), [id]);
    const isChecked = useSelector(state => state.objectsUI.selectedObjectIDs.includes(id));
    
    return <FieldItem text={text} URL={URL} onChange={onChange} isChecked={isChecked} />;
});
