import React from "react";
import FieldItemContainer from "../field-item/field-item-container";
import { toggleTagSelection } from "../../actions/tags";

/* 
    FieldItem component factory for the /tags page.
*/
const getText = (state, id) => state.tags[id] ? state.tags[id].tag_name : "?";
const getIsSelected = (state, id) => state.tagsUI.selectedTagIDs.includes(id);

export default function tagsFieldItemFactory(state, itemIDs) {
    let items = [];
    for (let id of itemIDs) {
        items.push(
            <FieldItemContainer key={id} getText={getText} getIsSelected={getIsSelected} /*isSelected={state.tagsUI.selectedTagIDs.includes(id)} */
                itemID={id} onClickRedirectURL={`/tags/${id}`} onCheckActionCreator={toggleTagSelection} />
        );
    }
    return items;
}