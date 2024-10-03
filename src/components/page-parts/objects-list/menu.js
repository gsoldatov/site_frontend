import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import { HorizontalMenu, HorizontalMenuGroup, HorizontalMenuButton, 
    HorizontalMenuFilter, HorizontalMenuDropdown, HorizontalMenuUpdatableDropdown } from "../../modules/horizontal-menu";

import { selectObjects, clearSelectedObjects, setObjectsPaginationInfo, setTagsFilterInput  } from "../../../actions/objects-list";
import { setObjectsPaginationInfoAndFetchPage, setTagsFilterAndFetchPage, tagsFilterDropdownFetch, } from "../../../fetches/ui-objects-list";
import { isFetchingObjects } from "../../../store/state-util/ui-objects-list";
import { enumObjectTypes } from "../../../util/enum-object-types";


/**
 * /objects/list field menu
 */
export const ObjectsListHorizontalMenu = () => {
    const dispatch = useDispatch();

    // Common props
    const isDisabled = useSelector(state => isFetchingObjects(state));
    
    // Select all objects button
    const currentPageObjectIDs = useSelector(state => state.objectsUI.paginationInfo.currentPageObjectIDs);
    const selectAllOnClick = useMemo(() => () => dispatch(selectObjects(currentPageObjectIDs)), [currentPageObjectIDs]);

    // Deselect all objects button
    const deselectAllOnClick = useMemo(() => () => dispatch(clearSelectedObjects()), []);

    // Sort asc button
    const sortAscOnClick = useMemo(() => () => dispatch(setObjectsPaginationInfoAndFetchPage({ sortOrder: "asc" })), []);
    const sortAscIsActive = useSelector(state => state.objectsUI.paginationInfo.sortOrder === "asc");

    // Sort desc button
    const sortDescOnClick = useMemo(() => () => dispatch(setObjectsPaginationInfoAndFetchPage({ sortOrder: "desc" })), []);
    const sortDescIsActive = useSelector(state => state.objectsUI.paginationInfo.sortOrder === "desc");

    // Sort by name button
    const sortByNameOnClick = useMemo(() => () => dispatch(setObjectsPaginationInfoAndFetchPage({ sortField: "object_name" })), []);
    const sortByNameIsActive = useSelector(state => state.objectsUI.paginationInfo.sortField === "object_name");

    // Sort by modify time button
    const sortByModifyTimeOnClick = useMemo(() => () => dispatch(setObjectsPaginationInfoAndFetchPage({ sortField: "modified_at" })), []);
    const sortByModifyTimeIsActive = useSelector(state => state.objectsUI.paginationInfo.sortField === "modified_at");

    // Object name filter
    const objectNameFilterValue = useSelector(state => state.objectsUI.paginationInfo.filterText);
    const objectNameFilterOnChange = useMemo(() => value => dispatch(setObjectsPaginationInfo({ filterText: value })), []);
    const objectNameFilterOnChangeDelayed = useMemo(() => value => dispatch(setObjectsPaginationInfoAndFetchPage({ filterText: value })), []);

    // Object type dropdown
    const objectTypesDefaultValue = useSelector(state => state.objectsUI.paginationInfo.objectTypes);
    const objectTypesOptions = useMemo(() => Object.values(enumObjectTypes).map((t, k) => ({ key: k, text: t.multipleName, value: t.type })), []);
    const objectTypesOnChange = useMemo(() => (e, data) => dispatch(setObjectsPaginationInfoAndFetchPage({ objectTypes: data.value })), []);

    // Tags filter dropdown
    const tagsFilterInputState = useSelector(state => state.objectsUI.tagsFilterInput);
    const tagsFilterExistingIDs = useSelector(state => state.objectsUI.paginationInfo.tagsFilter);
    const tagsFilterOptionsSelector = useMemo(() => createSelector(
        state => state.tags,
        state => state.objectsUI.tagsFilterInput,
        (tags, inputState) => {
            return inputState.matchingIDs.map(tagID => {
                return { key: tagID, text: tags[tagID].tag_name, value: tagID };
            });
        }
    ), []);
    const tagsFilterOptions = useSelector(tagsFilterOptionsSelector);
    
    const tagsFilterOnSearchChange = useMemo(() => inputParams => dispatch(setTagsFilterInput(inputParams)), []);
    const tagsFilterOnSearchChangeDelayed = useMemo(() => inputParams => dispatch(tagsFilterDropdownFetch(inputParams)), []);
    const tagsFilterOnChange = useMemo(() => values => dispatch(setTagsFilterAndFetchPage(values)), []);

    // Tags filter clear button
    const tagsFilterClearOnClick = useMemo(() => () => dispatch(setTagsFilterAndFetchPage()), []);
    const tagsFilterClearIsDisabled = useSelector(state => isFetchingObjects(state) || state.objectsUI.paginationInfo.tagsFilter.length == 0);

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
                <HorizontalMenuFilter value={objectNameFilterValue} placeholder="Filter objects" isDisabled={isDisabled}
                    onChange={objectNameFilterOnChange} onChangeDelayed={objectNameFilterOnChangeDelayed} />
            </HorizontalMenuGroup>

            <HorizontalMenuGroup>
                <HorizontalMenuDropdown defaultValue={objectTypesDefaultValue} options={objectTypesOptions} onChange={objectTypesOnChange}
                    placeholder="Filter by object type" isDisabled={isDisabled} />
            </HorizontalMenuGroup>

            <HorizontalMenuGroup>
                <HorizontalMenuUpdatableDropdown placeholder="Filter objects by tags" isDisabled={isDisabled}
                    inputState={tagsFilterInputState} existingIDs={tagsFilterExistingIDs} options={tagsFilterOptions} 
                    onSearchChange={tagsFilterOnSearchChange} onSearchChangeDelayed={tagsFilterOnSearchChangeDelayed} onChange={tagsFilterOnChange} />
                <HorizontalMenuButton icon="remove" title="Clear tags filter" className="borderless" 
                    onClick={tagsFilterClearOnClick} isDisabled={tagsFilterClearIsDisabled} />
            </HorizontalMenuGroup>
        </HorizontalMenu>
    );
};
