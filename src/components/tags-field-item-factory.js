import React from "react";
import FieldItemContainer from "./field-item-container";
import { toggleTagSelection } from "../actions/tags";


export default function tagsFieldItemFactory(state, itemIDs) {
    const getText = (state, id) => state.tags[id] ? state.tags[id].tag_name : "?";
    let items = [];
    for (let id of itemIDs) {
        items.push(
            <FieldItemContainer key={id} getText={getText} isSelected={state.tagsUI.selectedTagIDs.includes(id)} 
                tag_id={id} onClickRedirectURL={`/tags/${id}`} onCheckActionCreator={toggleTagSelection} />
        );
    }
    return items;
}