import React, { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Message } from "semantic-ui-react";

import { TDLContainer } from "../../edit/to-do-list/to-do-list";

import { toDoListObjectUpdateFetch } from "../../../fetches/ui-objects-view";

import { getUpdatedToDoList } from "../../../reducers/helpers/object-to-do-lists";
import { deepCopy } from "../../../util/copy";
import intervalWrapper from "../../../util/interval-wrapper";
import { enumUserLevels } from "../../../util/enum-user-levels";


/**
 * To-do list object data display component on the /objects/view/:id page.
 */
export const ObjectDataToDoList = ({ objectID }) => {
    const dispatch = useDispatch();

    // Readonly state
    const isReadonly = useSelector(state => state.auth.numeric_user_level !== enumUserLevels.admin && state.auth.user_id !== state.objects[objectID].owner_id);

    // Error state
    const [error, setError] = useState("");

    // To-do list state
    // NOTE: state is stored in a Ref object to avoid constant modification of `updateCallback` function, which would trigger cascade update of all items
    // (useState hook reference would change with each update).
    // To trigger a rerender after to-do list state inside Ref object is modified a mock state object `rnd` is used.
    const _toDoList = useSelector(state => state.toDoLists[objectID]);
    const [rnd, setRnd] = useState(0);
    const toDoListRef = useRef(deepCopy(_toDoList));

    // Update state on `objectID` change
    useEffect(() => {
        toDoListRef.current = deepCopy(_toDoList);
    }, [objectID]);

    // "Drag is enabled" prop
    const canDrag = toDoListRef.current.sort_type === "default";

    // Debounced update fetch
    const updateFetch = useMemo(() => (intervalWrapper(async (objectID, toDoList) => {
        setError("");

        if (!isReadonly) {
            const result = await dispatch(toDoListObjectUpdateFetch(objectID, toDoList));
            if ("error" in result) setError(result.error);
        }
    }, 1000, true)), [isReadonly]);
    
    // Update callback
    const updateCallback = useMemo(() => params => {
        if ("toDoListItemUpdate" in params) {
            toDoListRef.current = getUpdatedToDoList(toDoListRef.current, params.toDoListItemUpdate);
        } else if ("toDoList" in params) {
            toDoListRef.current = {...toDoListRef.current, ...params.toDoList };
        } else throw Error("Received incorrect `params` value in to-do list update callback.");

        setRnd(Math.random());  // trigger rerender
        updateFetch(objectID, toDoListRef.current);
    }, [objectID]);

    // Readonly message
    const readonlyMessage = isReadonly && (
        <Message info>Object is in readonly mode, updates will not be saved.</Message>
    );

    // Error message
    const errorMessage = error.length > 0 && (
        <Message error>
            <Message.Header>Failed to update to-do list</Message.Header>
            {error}
        </Message>
    );

    return (
        <div className="objects-view-data to-do-list">
            {readonlyMessage}
            {errorMessage}
            <TDLContainer objectID={objectID} toDoList={toDoListRef.current} canDrag={canDrag} updateCallback={updateCallback} dontDispatchOnClickHandlers />
        </div>
    );
};
