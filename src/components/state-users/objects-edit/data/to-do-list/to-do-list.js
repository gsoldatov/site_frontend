import React, { useEffect, useRef, memo, useMemo } from "react";
import { useSelector } from "react-redux";

import { HorizontalMenu, HorizontalMenuGroup, HorizontalMenuButton } from "../../../../modules/horizontal-menu";
import { DraggableTDLItem } from "./item";
import { DroppableNewTDLItem } from "./new-item";

import { getVisibleItemIDs } from "../../../../../store/state-util/to-do-lists";
import { ToDoListSelectors } from "../../../../../store/selectors/data/objects/to-do-list";

import * as caret from "../../../../../util/caret";   // wrapped into an object to make functions mockable in tests

import StyleTDL from "../../../../../styles/modules/edit/to-do-lists.css";


/**
 * To-do list data container component.
 */
export const TDLContainer = ({ objectID, toDoList, updateCallback, canDrag }) => {

    return (
        <div className="to-do-list-container">
            {/* <div className="to-do-list-container-header">To-Do List</div> */}
            <TDLMenu updateCallback={updateCallback} sortType={toDoList.sort_type} />
            <TDLItems updateCallback={updateCallback} objectID={objectID} toDoList={toDoList} canDrag={canDrag} />    
        </div>
    );
};


const TDLMenu = memo(({ sortType, updateCallback }) => {
    // Default sort button
    const defaultSortOnClick = useMemo(() => () => updateCallback({ toDoList: { sort_type: "default" }}), [updateCallback]);
    const defaultSortIsActive = sortType === "default";

    // Sort by state button
    const sortByStateOnClick = useMemo(() => () => updateCallback({ toDoList: { sort_type: "state", newItemInputIndent: 0 }}), [updateCallback]);   // also reset new item input indent when sorting by state
    const sortByStateIsActive = sortType === "state";

    return (
        <HorizontalMenu size="mini" className="to-do-list-menu">
            <HorizontalMenuGroup isButtonGroup disableSmallScreenStyling>
                <HorizontalMenuButton icon="ordered list" title="Default sort" onClick={defaultSortOnClick} isActive={defaultSortIsActive} />
                <HorizontalMenuButton icon="tasks" title="Sort by state" onClick={sortByStateOnClick} isActive={sortByStateIsActive} />
            </HorizontalMenuGroup>
        </HorizontalMenu>
    );
});


const TDLItems = ({ objectID, toDoList, updateCallback, canDrag }) => {
    const itemsRef = useRef();
    const itemOrder = toDoList.itemOrder;

    // Check if to-do list items should be rerendered to match the state of object
    // (currently used on /objects/edit/:id page whenever an object is reset or saved)
    const updateInnerHTMLRequired = useSelector(state => state.objectsEditUI.toDoListRerenderPending);

    // Focus item specified in setFocusOnID
    useEffect(() => {
        if (toDoList.setFocusOnID !== -1) {
            if (toDoList.setFocusOnID === "newItem") {  // new item input (focus)
                itemsRef.current.querySelector(".to-do-list-item-input.new").focus();
            } else {    // existing item input (set caret & focus)
                const focusedInput = [...itemsRef.current.querySelectorAll(".to-do-list-item-id")]
                    .filter(node => node.textContent === toDoList.setFocusOnID.toString())[0].parentNode.querySelector(".to-do-list-item-input");
                
                caret.setCaret(focusedInput, toDoList.caretPositionOnFocus);

                focusedInput.focus();
            }

            updateCallback({ toDoList: { setFocusOnID: -1, caretPositionOnFocus: -1 }});
        }

    }, [toDoList.setFocusOnID]);

    const sortedItems = ToDoListSelectors.sortedItemIDs(toDoList);
    const visibleSortedItems = getVisibleItemIDs(toDoList, sortedItems);

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
