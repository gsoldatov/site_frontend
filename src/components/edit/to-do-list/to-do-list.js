import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import FieldMenu from "../../field/field-menu";
import { DraggableTDLItem } from "./item";
import { DroppableNewTDLItem } from "./new-item";

import { setEditedObject } from "../../../actions/object";
import { getEditedOrDefaultObjectSelector } from "../../../store/state-util/ui-object";
import { getSortedItemIDs, getVisibleItemIDs } from "../../../store/state-util/to-do-lists";
import { getIsTDLDragAndDropEnabledSelector } from "../../../store/state-util/ui-object";

import StyleTDL from "../../../styles/to-do-lists.css";


/**
 * To-do list data container component.
 */
export const TDLContainer = ({ objectID }) => {
    const dispatch = useDispatch();
    const canDrag = useSelector(getIsTDLDragAndDropEnabledSelector(objectID));
    const updateCallback = useMemo(
        () => params => dispatch(setEditedObject(params, objectID))
    , [objectID]);

    return (
        <div className="to-do-list-container">
            <div className="to-do-list-container-header">To-Do List</div>
            <TDLMenu updateCallback={updateCallback} objectID={objectID} />
            <TDLItems updateCallback={updateCallback} objectID={objectID} canDrag={canDrag} />    
        </div>
    );
};


const TDLMenu = ({ objectID, updateCallback }) => {
    const fieldMenuItems = [
        {
            type: "item",
            icon: "ordered list",
            title: "Default sort",
            onClick: updateCallback,
            onClickParams: { toDoList: { sort_type: "default" }},
            isActiveSelector: state => getEditedOrDefaultObjectSelector(objectID)(state).toDoList.sort_type === "default"
        },
        {
            type: "item",
            icon: "tasks",
            title: "Sort by state",
            onClick: updateCallback,
            onClickParams: { toDoList: { sort_type: "state", newItemInputIndent: 0 }},     // also reset new item input indent when sorting by state
            isActiveSelector: state => getEditedOrDefaultObjectSelector(objectID)(state).toDoList.sort_type === "state"
        }
    ];

    return <FieldMenu size="mini" className="to-do-list-menu" items={fieldMenuItems} />;
};


const TDLItems = ({ updateCallback, objectID, canDrag }) => {
    const itemsRef = useRef();
    const toDoList = useSelector(getEditedOrDefaultObjectSelector(objectID)).toDoList;
    const itemOrder = toDoList.itemOrder;

    // State checks performed to update dangerouslySetInnerHTML of <TDLItem> and <Comment> components when needed
    // (currently checks if a reset side menu dialog was closed, because innerHTML of the components may need to be updated to the values restored by reset)
    const showResetDialog = useSelector(state => state.objectUI.showResetDialog);
    const [previousShowResetDialog, setPreviousShowResetDialog] = useState(showResetDialog);
    const [updateInnerHTMLRequired, setUpdateInnerHTMLRequired] = useState(false);
    
    useEffect(() => {
        setUpdateInnerHTMLRequired(!showResetDialog && previousShowResetDialog);
        setPreviousShowResetDialog(showResetDialog);
    }); // update after each render to set updateInnerHTMLRequired = false as soon as possible
    // }, [showResetDialog]);

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
    let visibleSortedItems = getVisibleItemIDs(toDoList, sortedItems);

    // Existing items
    const itemComponents = visibleSortedItems.map((id, index) => {
        const item = toDoList.items[id];

        const sortedItemsIndex = sortedItems.indexOf(id);
        const nextID = sortedItems[sortedItemsIndex + 1];
        const hasChildren = toDoList.items[nextID] !== undefined && toDoList.items[nextID].indent > toDoList.items[id].indent;
        const isParentDragged = toDoList.draggedChildren.includes(id);
        
        let prevNonDraggedID;   
        for (let i = index - 1; i >= 0; i--) {  // get maximum allowed drop indent from a previous non-dragged item
            const checkedID = visibleSortedItems[i];
            if (checkedID !== toDoList.draggedParent && !toDoList.draggedChildren.includes(checkedID)) {
                prevNonDraggedID = checkedID;
                break;
            }
        }
        const maxIndent = prevNonDraggedID !== undefined ? toDoList.items[prevNonDraggedID].indent + 1 : 0;
        const dropIndent = toDoList.draggedOver === id ? toDoList.dropIndent : undefined;     // don't pass dropIndent if an item is not dragged over to avoid re-renders

        return <DraggableTDLItem key={id} id={id} updateCallback={updateCallback} objectID={objectID} canDrag={canDrag} hasChildren={hasChildren} 
            isParentDragged={isParentDragged} dropIndent={dropIndent} maxIndent={maxIndent} updateInnerHTMLRequired={updateInnerHTMLRequired} {...item} />;
    });
    
    // New item input
    let lastNonDraggedID;   // get maximum allowed drop indent from a last non-dragged item
    for (let i = visibleSortedItems.length - 1; i >= 0; i--) {
        const checkedID = visibleSortedItems[i];
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
