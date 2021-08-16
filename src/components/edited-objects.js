import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Confirm, Icon, Label, Table } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { createSelector } from "reselect";

import { LoadIndicatorAndError, SaveError, TimeStamps, NameDescriptionInput } from "./edit/common";
import { ObjectTypeSelector, ObjectViewEditSwitch } from "./edit/object";
import Layout from "./common/layout";
import { InlineItemListBlock, InlineItemListWrapper } from "./inline/inline-item-list-containers";
import { InlineItemList } from "./inline/inline-item-list";
import { InlineItem } from "./inline/inline-item";
import { InlineInput } from "./inline/inline-input";

import { getCurrentObject, isFetchingObject, isFetchingOrOnLoadFetchFailed } from "../store/state-util/ui-object";
import { removeEditedObjects, resetEditedObjects, setEditedObject, setEditedObjectTags, setSelectedTab, setObjectTagsInput, 
         setShowResetDialogObject, setShowDeleteDialogObject, clearUnsavedCurrentEditedObject } from "../actions/object";
import { addObjectOnLoad, addObjectOnSaveFetch, editObjectOnLoadFetch, editObjectOnSaveFetch, editObjectOnDeleteFetch, objectTagsDropdownFetch } from "../fetches/ui-object";
import { enumObjectTypes } from "../util/enum-object-types";

import StyleEditedObjects from "../styles/edited-objects.css";


/**
 * /objects/edited page components.
 */
export const EditedObjects = () => {
    const editedObjects = useSelector(state => state.editedObjects);
    let body;

    // Confirm state
    const [confirmState, setConfirmState] = useState({
        open: false,
        content: "",
        onConfirm: undefined,
        onCancel: undefined
    });
    const handleConfirm = useMemo(() => () => {
        if (confirmState.onConfirm) confirmState.onConfirm();
        setConfirmState({ ...confirmState, open: false });
    }, [confirmState]);
    const handleCancel = useMemo(() => () => {
        if (confirmState.onCancel) confirmState.onCancel();
        setConfirmState({ ...confirmState, open: false });
    }, [confirmState]);

    
    // No edited objects exist
    if (Object.keys(editedObjects).length === 0)
        body = (
            <div className="edited-objects-placeholder">No edited objects found.</div>
        );
    // Edited objects exist
    else {
        // Confirmation dialog
        const { open, content } = confirmState;
        const confirm = <Confirm open={open} content={content}
            onConfirm={handleConfirm} onCancel={handleCancel} />;

        // Table items
        const items = Object.keys(editedObjects).map(objectID => {
            // Don't render new subobjects on top level
            if (parseInt(objectID) < 0) return null;

            return <EditedObjectItem key={objectID} objectID={objectID}
                setConfirmState={setConfirmState} />;
        });

        body = (
            <>
                {confirm}
                <Table striped unstackable>
                    <Table.Body>
                        {items}
                    </Table.Body>
                </Table>
            </>
        );

    }

    return <Layout body={body} />;
};


/**
 * A single item in edited objects table
 */
const EditedObjectItem = memo(({ objectID, setConfirmState }) => {
    objectID = parseInt(objectID);
    
    const editedObject = useSelector(state => state.editedObjects[objectID]);
    
    // Is new icon
    const isNewIcon = objectID <= 0 ? (
        <div className="edited-objects-item-is-new-icon-container" title="Object is new">
            <Icon name="plus" color="green" />
        </div>
    ) : null;

    // Object type icon
    const typeEnum = enumObjectTypes[editedObject.object_type];
    const objectTypeIcon = (
        <div className="edited-objects-item-object-type-icon-container" title={typeEnum.name}>
            <Icon name={typeEnum.icon} />
        </div>
    );

    // Object name and page link
    const objectURL = objectID > 0 ? `/objects/${objectID}`
        : objectID == 0 ? "/objects/add" : null;
    let objectName = <span>{editedObject.object_name || "<unnamed>"}</span>;
    if (objectURL) objectName = (
        <Link to={objectURL}>
            {objectName}
        </Link>
    );

    // Edited subobjects indicatior
    const editedSubobjectsIndicator = <EditedSubobjectsIndicator objectID={objectID} />;

    return (
        <Table.Row>
            {/* Is new icon */}
            <Table.Cell className="edited-objects-item-cell" collapsing>
                {isNewIcon}
            </Table.Cell>

            {/* Object type icon */}
            <Table.Cell className="edited-objects-item-cell" collapsing>
                {objectTypeIcon}
            </Table.Cell>

            {/* Object name and link */}
            <Table.Cell className="edited-objects-item-cell">
                {objectName}
            </Table.Cell>

            {/* Edited subobjects indicator */}
            <Table.Cell className="edited-objects-item-cell" collapsing>
                {editedSubobjectsIndicator}
            </Table.Cell>

            {/* Controls */}
            <Table.Cell className="edited-objects-item-cell controls" collapsing>
                <EditedObjectControls objectID={objectID} setConfirmState={setConfirmState} />
            </Table.Cell>
        </Table.Row>
    )
});


/**
 * Indicator with number of edited and total subobjects of a composite object.
 */
const EditedSubobjectsIndicator = ({ objectID }) => {
    const editedObjects = useSelector(state => state.editedObjects);
    const editedObject = editedObjects[objectID];

    if (editedObject.object_type !== "composite") return null;

    const totalSubobjects = Object.keys(editedObject.composite.subobjects).length;
    const editedSubobjects = Object.keys(editedObject.composite.subobjects).reduce(
        (acc, subobjectID) => acc + (subobjectID in editedObjects ? 1 : 0)
    , 0);

    const color = editedSubobjects > 0 ? "yellow" : "grey";
    const basic = editedSubobjects === 0;

    return (
        <Label size="tiny" basic={basic} color={color} title="Number of edited and total subobjects">
            {editedSubobjects} / {totalSubobjects}
        </Label>
    );
};


/**
 * Edited object controls.
 */
const EditedObjectControls = ({ objectID, setConfirmState }) => {
    const dispatch = useDispatch();
    const editedObject = useSelector(state => state.editedObjects[objectID]);

    const deleteCallback = useMemo(() => () => setConfirmState({
        open: true,
        content: "Delete edited object?",
        onConfirm: () => dispatch(removeEditedObjects([objectID], false))
    }), [objectID]);
    const deleteWithSubobjectsCallback = useMemo(() => () => setConfirmState({
        open: true,
        content: "Delete edited object and its subobjects?",
        onConfirm: () => dispatch(removeEditedObjects([objectID], true))
    }), [objectID]);

    const deleteControl = (
        <span className="edited-objects-item-control-container" title="Remove edited object" onClick={deleteCallback}>
            <Icon name="cancel" color="black" />
        </span>
    );
    const deleteWithSubobjectsControl = editedObject.object_type === "composite" && (
        <span className="edited-objects-item-control-container" title="Remove edited object with subobjects" onClick={deleteWithSubobjectsCallback}>
            <Icon name="cancel" color="red" />
        </span>
    );

    return (
        <>
            {deleteControl}
            {deleteWithSubobjectsControl}
        </>
    );
};
