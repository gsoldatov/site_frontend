import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DefaultObjectData } from  "./default-object-data";

import { LinkInput } from "./link";
import { MarkdownDataEditor } from "./markdown";
import { TDLContainer } from "./to-do-list/to-do-list";
import { SubobjectsContainer } from "../../../edit/composite/subobjects";

import { setEditedObject } from "../../../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../../../store/state-util/ui-objects-edit";
import { getIsTDLDragAndDropEnabledSelector } from "../../../../store/state-util/to-do-lists";


/**
 * Component for switching type-specific view/edit components.
 * 
 * If `subobjectCard` is true, displays default component for composite objects and styles if accordingly.
 */
export const ObjectDataSwitch = ({ objectID, subobjectCard = false }) => {
    const dispatch = useDispatch();
    const editedOrDefaultObjectSelector = useMemo(() => getEditedOrDefaultObjectSelector(objectID), [objectID]);
    const objectTypeSelector = useMemo(() => state => editedOrDefaultObjectSelector(state).object_type, [objectID]);
    const objectType = useSelector(objectTypeSelector);

    // To-do list props
    const toDoList = useSelector(getEditedOrDefaultObjectSelector(objectID)).toDoList;
    const canDragToDoList = useSelector(getIsTDLDragAndDropEnabledSelector(objectID));
    const toDoListUpdateCallback = useMemo(
        () => params => dispatch(setEditedObject(params, objectID))
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
