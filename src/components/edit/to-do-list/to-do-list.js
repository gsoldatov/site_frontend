import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import FieldMenu from "../../field/field-menu";
import { DraggableTDLItem } from "./item";
import { DroppableNewTDLItem } from "./new-item";
import { setCurrentObject } from "../../../actions/object";
import { getSortedItemIDs } from "../../../store/state-util/to-do-lists";
import { isTDLDragAndDropEnabled } from "../../../store/state-util/ui-object";

import StyleTDL from "../../../styles/to-do-lists.css";


/*
    Edit & view components for to-do lists.
*/
export const TDLContainer = () => {
    const dispatch = useDispatch();
    const objectID = useSelector(state => state.objectUI.currentObject.object_id);
    const canDrag = useSelector(isTDLDragAndDropEnabled);
    const updateCallback = useMemo(
        () => params => dispatch(setCurrentObject(params))
    , []);

    return (
        <div className="to-do-list-container">
            <div className="to-do-list-container-header">To-Do List</div>
            <TDLMenu updateCallback={updateCallback} />
            <TDLItems updateCallback={updateCallback} objectID={objectID} canDrag={canDrag} />    
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


const TDLItems = ({ updateCallback, objectID, canDrag }) => {
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
        return <DraggableTDLItem key={id} id={id} updateCallback={updateCallback} objectID={objectID} canDrag={canDrag} {...item} />;
    });
    
    const newItem = <DroppableNewTDLItem position={itemOrder.length} updateCallback={updateCallback} objectID={objectID} />;

    return (
        <div className="to-do-list-items" ref={itemsRef}>
            {itemComponents}
            {newItem}
        </div>
    );
};
