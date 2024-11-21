import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import { HorizontalMenu, HorizontalMenuGroup, HorizontalMenuButton, 
    HorizontalMenuFilter, HorizontalMenuDropdown, HorizontalMenuUpdatableDropdown } from "../../modules/horizontal-menu";

import { setObjectsListPaginationInfo, setObjectsListTagsFilterInput, selectObjects, clearSelectedObjects } from "../../../reducers/ui/objects-list";
import { objectsListTagsFilterDropdownFetch } from "../../../fetches/ui-objects-list";
import { setObjectsListPaginationInfoAndFetchPage, setObjectsListTagsFilterAndFetchPage } from "../../../fetches/ui/objects-list";
import { ObjectsListSelectors } from "../../../store/selectors/ui/objects-list";
import { objectTypeOptions } from "../../../store/types/ui/general/object-type";


/**
 * /objects/list field menu
 */
export const ObjectsListHorizontalMenu = () => {
    const dispatch = useDispatch();

    // Common props
    const isDisabled = useSelector(ObjectsListSelectors.isFetching);
    
    // Select all objects button
    const currentPageObjectIDs = useSelector(state => state.objectsListUI.paginationInfo.currentPageObjectIDs);
    const selectAllOnClick = useMemo(() => () => dispatch(selectObjects(currentPageObjectIDs)), [currentPageObjectIDs]);

    // Deselect all objects button
    const deselectAllOnClick = useMemo(() => () => dispatch(clearSelectedObjects()), []);

    // Sort asc button
    const sortAscOnClick = useMemo(() => () => dispatch(setObjectsListPaginationInfoAndFetchPage({ sortOrder: "asc" })), []);
    const sortAscIsActive = useSelector(state => state.objectsListUI.paginationInfo.sortOrder === "asc");

    // Sort desc button
    const sortDescOnClick = useMemo(() => () => dispatch(setObjectsListPaginationInfoAndFetchPage({ sortOrder: "desc" })), []);
    const sortDescIsActive = useSelector(state => state.objectsListUI.paginationInfo.sortOrder === "desc");

    // Sort by name button
    const sortByNameOnClick = useMemo(() => () => dispatch(setObjectsListPaginationInfoAndFetchPage({ sortField: "object_name" })), []);
    const sortByNameIsActive = useSelector(state => state.objectsListUI.paginationInfo.sortField === "object_name");

    // Sort by modify time button
    const sortByModifyTimeOnClick = useMemo(() => () => dispatch(setObjectsListPaginationInfoAndFetchPage({ sortField: "modified_at" })), []);
    const sortByModifyTimeIsActive = useSelector(state => state.objectsListUI.paginationInfo.sortField === "modified_at");

    // Object name filter
    const objectNameFilterValue = useSelector(state => state.objectsListUI.paginationInfo.filterText);
    const objectNameFilterOnChange = useMemo(() => value => dispatch(setObjectsListPaginationInfo({ filterText: value })), []);
    const objectNameFilterOnChangeDelayed = useMemo(() => value => dispatch(setObjectsListPaginationInfoAndFetchPage({ filterText: value })), []);

    // Object type dropdown
    const objectTypesDefaultValue = useSelector(state => state.objectsListUI.paginationInfo.objectTypes);
    const objectTypesOptions = useMemo(() => Object.values(objectTypeOptions).map((t, k) => ({ key: k, text: t.multipleName, value: t.type })), []);
    const objectTypesOnChange = useMemo(() => (e, data) => dispatch(setObjectsListPaginationInfoAndFetchPage({ objectTypes: data.value })), []);

    // Tags filter dropdown
    const tagsFilterInputState = useSelector(state => state.objectsListUI.tagsFilterInput);
    const tagsFilterExistingIDs = useSelector(state => state.objectsListUI.paginationInfo.tagsFilter);
    const tagsFilterOptionsSelector = useMemo(() => createSelector(
        state => state.tags,
        state => state.objectsListUI.tagsFilterInput,
        (tags, inputState) => {
            return inputState.matchingIDs.map(tagID => {
                return { key: tagID, text: tags[tagID].tag_name, value: tagID };
            });
        }
    ), []);
    const tagsFilterOptions = useSelector(tagsFilterOptionsSelector);
    
    const tagsFilterOnSearchChange = useMemo(() => inputParams => dispatch(setObjectsListTagsFilterInput(inputParams)), []);
    const tagsFilterOnSearchChangeDelayed = useMemo(() => (queryText, existingIDs) => dispatch(objectsListTagsFilterDropdownFetch(queryText, existingIDs)), []);
    const tagsFilterOnChange = useMemo(() => values => dispatch(setObjectsListTagsFilterAndFetchPage(values)), []);

    // Tags filter clear button
    const tagsFilterClearOnClick = useMemo(() => () => dispatch(setObjectsListTagsFilterAndFetchPage()), []);
    const tagsFilterClearIsDisabled = useSelector(state => ObjectsListSelectors.isFetching(state) || state.objectsListUI.paginationInfo.tagsFilter.length == 0);

    return (
        <HorizontalMenu>
            <HorizontalMenuGroup isButtonGroup>
                <HorizontalMenuButton icon="check" title="Select all objects on page" onClick={selectAllOnClick} isDisabled={isDisabled} />
                <HorizontalMenuButton icon="cancel" title="Deselect all objects" onClick={deselectAllOnClick} isDisabled={isDisabled} />
                <HorizontalMenuButton icon="sort content descending" title="Sort in ascending order" onClick={sortAscOnClick} 
                    isDisabled={isDisabled} isActive={sortAscIsActive} />
                <HorizontalMenuButton icon="sort content ascending" title="Sort in descending order" onClick={sortDescOnClick} 
                    isDisabled={isDisabled} isActive={sortDescIsActive} />
                <HorizontalMenuButton icon="font" title="Sort by object name" onClick={sortByNameOnClick} 
                    isDisabled={isDisabled} isActive={sortByNameIsActive} />
                <HorizontalMenuButton icon="clock outline" title="Sort by modify time" onClick={sortByModifyTimeOnClick} 
                    isDisabled={isDisabled} isActive={sortByModifyTimeIsActive} />
            </HorizontalMenuGroup>
            
            <HorizontalMenuGroup>
                <HorizontalMenuFilter value={objectNameFilterValue} placeholder="Filter objects"
                    onChange={objectNameFilterOnChange} onChangeDelayed={objectNameFilterOnChangeDelayed} />
            </HorizontalMenuGroup>

            <HorizontalMenuGroup>
                <HorizontalMenuDropdown defaultValue={objectTypesDefaultValue} options={objectTypesOptions} onChange={objectTypesOnChange}
                    placeholder="Filter by object type" />
            </HorizontalMenuGroup>

            <HorizontalMenuGroup>
                <HorizontalMenuUpdatableDropdown placeholder="Filter objects by tags"
                    inputState={tagsFilterInputState} existingIDs={tagsFilterExistingIDs} options={tagsFilterOptions} 
                    onSearchChange={tagsFilterOnSearchChange} onSearchChangeDelayed={tagsFilterOnSearchChangeDelayed} onChange={tagsFilterOnChange} />
                <HorizontalMenuButton icon="remove" title="Clear tags filter" className="borderless" 
                    onClick={tagsFilterClearOnClick} isDisabled={tagsFilterClearIsDisabled} />
            </HorizontalMenuGroup>
        </HorizontalMenu>
    );
};
