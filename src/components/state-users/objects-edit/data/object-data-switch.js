import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DefaultObjectData } from  "./default-object-data";

import { LinkInput } from "./link";
import { MarkdownDataEditor } from "./markdown";
import { TDLContainer } from "./to-do-list/to-do-list";
import { SubobjectsContainer } from "./composite/subobjects";

import { updateEditedObject, updateEditedToDoList } from "../../../../reducers/data/edited-objects";
import { ObjectsEditSelectors } from "../../../../store/selectors/ui/objects-edit";


/**
 * Component for switching type-specific view/edit components.
 * 
 * If `subobjectCard` is true, displays default component for composite objects and styles if accordingly.
 */
export const ObjectDataSwitch = ({ objectID, subobjectCard = false }) => {
    const dispatch = useDispatch();
    const editedOrDefaultObjectSelector = useMemo(() => ObjectsEditSelectors.editedOrDefaultSelector(objectID), [objectID]);
    const objectTypeSelector = useMemo(() => state => editedOrDefaultObjectSelector(state).object_type, [objectID]);
    const objectType = useSelector(objectTypeSelector);

    // To-do list props
    const toDoList = useSelector(ObjectsEditSelectors.editedOrDefaultSelector(objectID)).toDoList;
    const canDragToDoList = useSelector(state => ObjectsEditSelectors.toDoListDragAndDropEnabled(state, objectID));
    const toDoListUpdateCallback = useMemo(() => params => {
        if ("toDoListItemUpdate" in params) {
            dispatch(updateEditedToDoList(objectID, params.toDoListItemUpdate));
        } else if ("toDoList" in params) {
            dispatch(updateEditedObject(objectID, params));
        } else throw Error("Received incorrect `params` value in to-do list update callback.");
    }
    , [objectID]);

    switch (objectType) {
        case "link":
            return <LinkInput objectID={objectID} />;
        case "markdown":
            return <MarkdownDataEditor objectID={objectID} />;
        case "to_do_list":
            return <TDLContainer objectID={objectID} toDoList={toDoList} canDrag={canDragToDoList} updateCallback={toDoListUpdateCallback} />;
        case "composite":
            if (subobjectCard)
                return <DefaultObjectData objectID={objectID} subobjectCard />;
            else
                return <SubobjectsContainer objectID={objectID} />;
        default:
            return <DefaultObjectData objectID={objectID} subobjectCard={subobjectCard} />;
    }
};
