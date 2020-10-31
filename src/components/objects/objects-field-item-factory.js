import React from "react";
import FieldItemContainer from "../field-item/field-item-container";
import { toggleObjectSelection } from "../../actions/objects";

/* 
    FieldItem component factory for the /objects page.
*/
const getText = (state, id) => state.objects[id] ? state.objects[id].object_name : "?";
const getIsSelected = (state, id) => state.objectsUI.selectedObjectIDs.includes(id);

export default function objectsFieldItemFactory(state, itemIDs) {
    let items = [];
    for (let id of itemIDs) {
        items.push(
            <FieldItemContainer key={id} getText={getText} getIsSelected={getIsSelected}
                itemID={id} onClickRedirectURL={`/objects/${id}`} onCheckActionCreator={toggleObjectSelection} />
        );
    }
    return items;
}