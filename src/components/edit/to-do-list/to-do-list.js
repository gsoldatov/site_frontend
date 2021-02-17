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
            onClick: updateCallback,
            onClickParams: { toDoList: { sort_type: "default" }},
            isActiveSelector: state => state.objectUI.currentObject.toDoList.sort_type === "default"
        },
        {
            type: "item",
            icon: "tasks",
            title: "Sort by state",
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

    // Existing items
    const itemComponents = sortedItems.map((id, index) => {
        const item = toDoList.items[id];

        const nextID = sortedItems[index + 1];
        const hasChildren = toDoList.items[nextID] !== undefined && toDoList.items[nextID].indent > toDoList.items[id].indent;
        const isParentDragged = toDoList.draggedChildren.includes(id);
        
        let prevNonDraggedID;   
        for (let i = index - 1; i >= 0; i--) {  // get maximum allowed drop indent from a previous non-dragged item
            const checkedID = sortedItems[i];
            if (checkedID !== toDoList.draggedParent && !toDoList.draggedChildren.includes(checkedID)) {
                prevNonDraggedID = checkedID;
                break;
            }
        }
        const maxIndent = prevNonDraggedID !== undefined ? toDoList.items[prevNonDraggedID].indent + 1 : 0;
        const dropIndent = toDoList.draggedOver === id ? toDoList.dropIndent : undefined;     // don't pass dropIndent if an item is not dragged over to avoid re-renders

        return <DraggableTDLItem key={id} id={id} updateCallback={updateCallback} objectID={objectID} canDrag={canDrag} hasChildren={hasChildren} 
            isParentDragged={isParentDragged} dropIndent={dropIndent} maxIndent={maxIndent} {...item} />;
    });
    
    // New item input
    let lastNonDraggedID;   // get maximum allowed drop indent from a last non-dragged item
    for (let i = sortedItems.length - 1; i >= 0; i--) {
        const checkedID = sortedItems[i];
        if (checkedID !== toDoList.draggedParent && !toDoList.draggedChildren.includes(checkedID)) {
            lastNonDraggedID = checkedID;
            break;
        }
    }
    const maxIndent = lastNonDraggedID !== undefined ? toDoList.items[lastNonDraggedID].indent + 1 : 0;
    const dropIndent = toDoList.draggedOver === "newItem" ? toDoList.dropIndent : undefined;     // don't pass dropIndent if new item is not dragged over to avoid re-renders

    const newItem = <DroppableNewTDLItem position={itemOrder.length} indent={toDoList.newItemInputIndent} updateCallback={updateCallback} objectID={objectID} 
        dropIndent={dropIndent} maxIndent={maxIndent}  />;

    return (
        <div className="to-do-list-items" ref={itemsRef}>
            {itemComponents}
            {newItem}
        </div>
    );
};
