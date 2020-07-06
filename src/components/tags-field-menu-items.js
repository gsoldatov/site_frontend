import React from "react";
import FieldMenuButtonContainer from "./field-menu-button-container";
import FieldMenuFilterContainer from "./field-menu-filter-container";

import { selectTags, clearSelectedTags, setTagsPaginationInfoAndFetchPage } from "../actions/tags";
import { isFetchingTags } from "../store/state-check-functions";

import selectAllImg from "../icons/select_all.png";
import clearAllImg from "../icons/clear_all.png";
import sortAscImg from "../icons/sort_asc.png";
import sortDescImg from "../icons/sort_desc.png";
import sortByNameImg from "../icons/sort_by_name.png";
import sortByTimeImg from "../icons/sort_by_time.png";

const selectAllGetOnClickParams = state => [state.tagsUI.paginationInfo.currentPageTagIDs];
const sortAscGetOnClickParams = () => ({ sortOrder: "asc" });
const sortDescGetOnClickParams = () => ({ sortOrder: "desc" });
const sortByTagNameOnClickParams = () => ({ sortField: "tag_name" });
const sortByModifyTimeOnClickParams = () => ({ sortField: "modified_at" });
const tagFilterOnChangeParams = text => ({ filterText: text });

const selectAllClearAllGetButtonState = state => isFetchingTags(state) ? "inactive" : "active";
const sortAscGetButtonState = state => isFetchingTags(state) ? "inactive" 
                                        : state.tagsUI.paginationInfo.sortOrder === "asc" ? "pressed" : "active";
const sortDescGetButtonState = state => isFetchingTags(state) ? "inactive" 
                                        : state.tagsUI.paginationInfo.sortOrder === "desc" ? "pressed" : "active";
const sortByTagNameGetButtonState = state => isFetchingTags(state) ? "inactive" 
                                        : state.tagsUI.paginationInfo.sortField === "tag_name" ? "pressed" : "active";
const sortByModifyTimeGetButtonState = state => isFetchingTags(state) ? "inactive" 
                                        : state.tagsUI.paginationInfo.sortField === "modified_at" ? "pressed" : "active";

export default function getTagsFieldMenuItems() {
    const items = [];
    let key = 0;

    items.push(<FieldMenuButtonContainer key={key++} title="Select all tags on page" src={selectAllImg} onClick={selectTags} getOnClickParams={selectAllGetOnClickParams}
        getButtonState={selectAllClearAllGetButtonState} />);
    items.push(<FieldMenuButtonContainer key={key++} title="Clear tag selection" src={clearAllImg} onClick={clearSelectedTags}
        getButtonState={selectAllClearAllGetButtonState} />);

    items.push(<FieldMenuButtonContainer key={key++} title="Sort in ascending order" src={sortAscImg} onClick={setTagsPaginationInfoAndFetchPage} getOnClickParams={sortAscGetOnClickParams}
        getButtonState={sortAscGetButtonState} />);
    items.push(<FieldMenuButtonContainer key={key++} title="Sort in descending order" src={sortDescImg} onClick={setTagsPaginationInfoAndFetchPage} getOnClickParams={sortDescGetOnClickParams}
        getButtonState={sortDescGetButtonState} />);

    items.push(<FieldMenuButtonContainer key={key++} title="Sort by tag name" src={sortByNameImg} onClick={setTagsPaginationInfoAndFetchPage} getOnClickParams={sortByTagNameOnClickParams}
        getButtonState={sortByTagNameGetButtonState} />);
    items.push(<FieldMenuButtonContainer key={key++} title="Sort by modify time" src={sortByTimeImg} onClick={setTagsPaginationInfoAndFetchPage} getOnClickParams={sortByModifyTimeOnClickParams}
        getButtonState={sortByModifyTimeGetButtonState} />);
    
    items.push(<FieldMenuFilterContainer key={key++} placeholder="Filter tags" onChange={setTagsPaginationInfoAndFetchPage} getOnChangeParams={tagFilterOnChangeParams} />);

    return items;
}
