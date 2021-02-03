import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import FieldMenu from "../../field/field-menu";
import { TDLItem } from "./item";
import { NewTDLItem } from "./new-item";
import { setCurrentObject } from "../../../actions/object";
import { getSortedItemIDs } from "../../../reducers/object-to-do-lists";

import StyleTDL from "../../../styles/to-do-lists.css";


/*
    Edit & view components for to-do lists.
*/
export const TDLContainer = () => {
    const dispatch = useDispatch();
    const updateCallback = useMemo(
        () => params => dispatch(setCurrentObject(params))
    , []);

    return (
        <div className="to-do-list-container">
            <div className="to-do-list-container-header">To-Do List</div>
            <TDLMenu updateCallback={updateCallback} />
            <TDLItems updateCallback={updateCallback} />    
        </div>
    );
};


const TDLMenu = ({ updateCallback }) => {
    const fieldMenuItems = [
        {
            type: "item",
            icon: "ordered list",
            title: "Default sort",
            size: "tiny",
            onClick: updateCallback,
            onClickParams: { toDoList: { sort_type: "default" }},
            isActiveSelector: state => state.objectUI.currentObject.toDoList.sort_type === "default"
        },
        {
            type: "item",
            icon: "tasks",
            title: "Sort by state",
            size: "tiny",
            onClick: updateCallback,
            onClickParams: { toDoList: { sort_type: "state" }},
            isActiveSelector: state => state.objectUI.currentObject.toDoList.sort_type === "state"
        }
    ];

    return <FieldMenu size="mini" className="to-do-list-menu" items={fieldMenuItems} />;
};

const TDLItems = ({ updateCallback }) => {
    const itemsRef = useRef();
    const toDoList = useSelector(state => state.objectUI.currentObject.toDoList);
    const itemOrder = toDoList.itemOrder;

    // Focus item specified in setFocusOnID
    useEffect(() => {
        if (toDoList.setFocusOnID !== -1) {
            if (toDoList.setFocusOnID === "newItem") {  // new item input (focus)
                itemsRef.current.querySelector(".to-do-list-item-input.new").focus();
            } else {    // existing item input (set caret at the end => focus)
                const focusedInput = [...itemsRef.current.querySelectorAll(".to-do-list-item-id")]
                    .filter(node => node.textContent === toDoList.setFocusOnID.toString())[0].parentNode.querySelector(".to-do-list-item-input");
                
                const range = document.createRange(), sel = window.getSelection();
                if (focusedInput.textContent.length > 0) {
                    const caretPosition = toDoList.caretPositionOnFocus > -1 && toDoList.caretPositionOnFocus < focusedInput.textContent.length
                        ? toDoList.caretPositionOnFocus     // set caret position to specified value or to the end of the line (default)
                        : focusedInput.textContent.length;
                    range.setStart(focusedInput.firstChild, caretPosition);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }

                focusedInput.focus();
            }

            updateCallback({ toDoList: { setFocusOnID: -1, caretPositionOnFocus: -1 }});
        }

    }, [toDoList.setFocusOnID]);

    let sortedItems = getSortedItemIDs(toDoList);

    const itemComponents = sortedItems.map(id => {
        const item = toDoList.items[id];
        return <TDLItem key={id} id={id} updateCallback={updateCallback} {...item} />;
    });
    
    const newItem = <NewTDLItem position={itemOrder.length} updateCallback={updateCallback} /*onChange={newItemOnChange}*/ />;

    return (
        <div className="to-do-list-items" ref={itemsRef}>
            {itemComponents}
            {newItem}
        </div>
    );
};




/*
    TODO   
    - move not directly related to reducing functions from reducers to util;
    - create a folder for reducer helping functions;
    
    ???
    
    - update `itemOrder` and `key` props if:
        ? setCurrentObject is run with object_type or new object_type === "to_do_list":
            ? run after other updates were implemented;
        - when an item is added, generate a `key` for it;
        - when an item is deleted, remove the key from it `itemOrder`;
        - one of:
            - A:
                - when object data is loaded from backend for a to-do list, generate `itemOrder` list (and other frontend-only props) and convert array of items into an object;
                - when saving data to backend, convert item object into array using `itemOrder`;
            - B:
                - when `items` is passed as a prop for toDoList in `SetCurrentObject`, convert it to an object with `key`: `item` structure and generate `itemOrder`;
                - when saving data to backend, convert item object into array using `itemOrder`;
                - when saving data to state storage, convert item object into array using `itemOrder`;
*/