import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { TDLItem } from "./item";
import { NewTDLItem } from "./new-item";
import { setCurrentObject } from "../../../actions/object";

import StyleTDL from "../../../styles/to-do-lists.css";


/*
    Edit & view components for to-do lists.
*/
export const TDLContainer = () => {
    return (
        <div className="to-do-list-container">
            <div className="to-do-list-container-header">To-Do List</div>
            <TDLMenu />
            <TDLItems />    
        </div>
    );
};


const TDLMenu = () => {
    return <div className="to-do-list-menu">Menu</div>;
};

const TDLItems = () => {
    const dispatch = useDispatch();
    const itemsRef = useRef();
    const toDoList = useSelector(state => state.objectUI.currentObject.toDoList);
    const itemOrder = toDoList.itemOrder;

    // Focus item specified in setFocusOnID
    useEffect(() => {
        if (toDoList.setFocusOnID !== -1) {
            if (toDoList.setFocusOnID === "newItem") {  // new item input (focus)
                itemsRef.current.querySelector(".to-do-list-item-input.new").focus();
            } else {    // existing item input (set caret at the end => focus)
                const index = toDoList.itemOrder.indexOf(toDoList.setFocusOnID);
                console.log(`IN ITEMS USE EFFECT, index = ${index}`)
                console.log(`itemsRef.current.childNode[index] = ${itemsRef.current.childNodes[index]}`)
                const focusedInput = itemsRef.current.childNodes[index].querySelector(".to-do-list-item-input");

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

            itemUpdateCallback({ toDoList: { setFocusOnID: -1, caretPositionOnFocus: -1 }});
        }

    }, [toDoList.setFocusOnID])
    
    const itemUpdateCallback = useMemo(
        () => params => dispatch(setCurrentObject(params))
    , []);

    const itemComponents = itemOrder.map(id => {
        const item = toDoList.items[id];
        return <TDLItem key={id} id={id} updateCallback={itemUpdateCallback} {...item} />;
    });
    
    const newItem = <NewTDLItem position={itemOrder.length} updateCallback={itemUpdateCallback} /*onChange={newItemOnChange}*/ />;

    return (
        <div className="to-do-list-items" ref={itemsRef}>
            {itemComponents}
            {newItem}
        </div>
    );
};




/*
    TODO
    
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