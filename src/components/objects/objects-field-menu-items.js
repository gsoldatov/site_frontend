import React from "react";
import FieldMenuButtonContainer from "../field-menu/field-menu-button-container";
import FieldMenuFilterContainer from "../field-menu/field-menu-filter-container";

import { selectObjects, clearSelectedObjects, setObjectsPaginationInfoAndFetchPage } from "../../actions/objects";
import { isFetchingObjects } from "../../store/state-check-functions";

import selectAllImg from "../../icons/select_all.png";
import clearAllImg from "../../icons/clear_all.png";
import sortAscImg from "../../icons/sort_asc.png";
import sortDescImg from "../../icons/sort_desc.png";
import sortByNameImg from "../../icons/sort_by_name.png";
import sortByTimeImg from "../../icons/sort_by_time.png";

/*
    Field menu item factory for the objects page.
*/
// Parameter getter for buttons' onClick handlers
const selectAllGetOnClickParams = state => [state.objectsUI.paginationInfo.currentPageObjectIDs];
const sortAscGetOnClickParams = () => ({ sortOrder: "asc" });
const sortDescGetOnClickParams = () => ({ sortOrder: "desc" });
const sortByObjectNameOnClickParams = () => ({ sortField: "object_name" });
const sortByModifyTimeOnClickParams = () => ({ sortField: "modified_at" });

// Button state getters
const selectAllClearAllGetButtonState = state => isFetchingObjects(state) ? "inactive" : "active";
const sortAscGetButtonState = state => isFetchingObjects(state) ? "inactive" 
                                        : state.objectsUI.paginationInfo.sortOrder === "asc" ? "pressed" : "active";
const sortDescGetButtonState = state => isFetchingObjects(state) ? "inactive" 
                                        : state.objectsUI.paginationInfo.sortOrder === "desc" ? "pressed" : "active";
const sortByObjectNameGetButtonState = state => isFetchingObjects(state) ? "inactive" 
                                        : state.objectsUI.paginationInfo.sortField === "object_name" ? "pressed" : "active";
const sortByModifyTimeGetButtonState = state => isFetchingObjects(state) ? "inactive" 
                                        : state.objectsUI.paginationInfo.sortField === "modified_at" ? "pressed" : "active";

// Parameter getters for filter onChange handler + filter initial text getter
const objectsFilterGetText = state => state.objectsUI.paginationInfo.filterText;
const objectsFilterOnChangeParams = text => ({ filterText: text });

export default function getObjectsFieldMenuItems() {
    const items = [];
    let key = 0;

    items.push(<FieldMenuButtonContainer key={key++} title="Select all objects on page" src={selectAllImg} onClick={selectObjects} getOnClickParams={selectAllGetOnClickParams}
        getButtonState={selectAllClearAllGetButtonState} />);
    items.push(<FieldMenuButtonContainer key={key++} title="Clear object selection" src={clearAllImg} onClick={clearSelectedObjects}
        getButtonState={selectAllClearAllGetButtonState} />);

    items.push(<FieldMenuButtonContainer key={key++} title="Sort in ascending order" src={sortAscImg} onClick={setObjectsPaginationInfoAndFetchPage} getOnClickParams={sortAscGetOnClickParams}
        getButtonState={sortAscGetButtonState} />);
    items.push(<FieldMenuButtonContainer key={key++} title="Sort in descending order" src={sortDescImg} onClick={setObjectsPaginationInfoAndFetchPage} getOnClickParams={sortDescGetOnClickParams}
        getButtonState={sortDescGetButtonState} />);

    items.push(<FieldMenuButtonContainer key={key++} title="Sort by object name" src={sortByNameImg} onClick={setObjectsPaginationInfoAndFetchPage} getOnClickParams={sortByObjectNameOnClickParams}
        getButtonState={sortByObjectNameGetButtonState} />);
    items.push(<FieldMenuButtonContainer key={key++} title="Sort by modify time" src={sortByTimeImg} onClick={setObjectsPaginationInfoAndFetchPage} getOnClickParams={sortByModifyTimeOnClickParams}
        getButtonState={sortByModifyTimeGetButtonState} />);
    
    items.push(<FieldMenuFilterContainer key={key++} getText={objectsFilterGetText} placeholder="Filter objects" onChange={setObjectsPaginationInfoAndFetchPage} getOnChangeParams={objectsFilterOnChangeParams} />);

    return items;
}
