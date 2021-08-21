import React, { memo, useEffect, useMemo, useState } from "react";
import { Checkbox, Confirm, Icon, Label, Table } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Layout from "./common/layout";

import { removeEditedObjects } from "../actions/object";
import { loadEditedObjectsPage, toggleEditedObjectSelection, toggleAllObjectsSelection } from "../actions/edited-objects";
import { enumObjectTypes } from "../util/enum-object-types";

import StyleEditedObjects from "../styles/edited-objects.css";


/**
 * /objects/edited page components.
 */
export const EditedObjects = () => {
    const dispatch = useDispatch();
    const editedObjects = useSelector(state => state.editedObjects);

    // Reset page UI on load
    useEffect(() => {
        dispatch(loadEditedObjectsPage());
    }, []);

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
    let body;
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
        
        // Subobject parents
        const parentObjects = {}, parentNames = {};
        for (let editedObject of Object.values(editedObjects)) {
            for (let subobjectID of Object.keys(editedObject.composite.subobjects)) {
                parentObjects[subobjectID] = parentObjects[subobjectID] || [];
                parentObjects[subobjectID].push(editedObject["object_id"]);

                parentNames[subobjectID] = parentNames[subobjectID] || [];
                parentNames[subobjectID].push(editedObject["object_name"])
            }
        }

        // Table items
        const items = Object.keys(editedObjects).map(objectID => {
            return <EditedObjectItem key={objectID} objectID={objectID} 
                parentObjects={parentObjects[objectID]} parentNames={parentNames[objectID]} setConfirmState={setConfirmState} />;
        });

        body = (
            <>
                {confirm}
                <Table striped unstackable className="edited-objects-table">
                    <EditedObjectsTableHeader setConfirmState={setConfirmState} />
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
 * Edited objects' table header.
 */
const EditedObjectsTableHeader = ({ setConfirmState }) => {
    const dispatch = useDispatch();
    
    // Toggle all selection checkbox
    const isChecked = useSelector(state => state.editedObjectsUI.selectedObjectIDs.size === Object.keys(state.editedObjects).length);
    const isIndeterminate = useSelector(state => state.editedObjectsUI.selectedObjectIDs.size < Object.keys(state.editedObjects).length && state.editedObjectsUI.selectedObjectIDs.size > 0);
    const checkBoxOnClick = useMemo(() => () => dispatch(toggleAllObjectsSelection()));
    const checkbox = <Checkbox checked={isChecked} indeterminate={isIndeterminate} onClick={checkBoxOnClick} />;

    // Selected edited objects controls
    const controls = <SelectedEditedObjectControls setConfirmState={setConfirmState} />;

    return (
        <Table.Header>
            <Table.Row>
                <Table.HeaderCell className="edited-objects-header-cell collapsing">{checkbox}</Table.HeaderCell>
                <Table.HeaderCell className="edited-objects-header-cell collapsing"></Table.HeaderCell>
                <Table.HeaderCell className="edited-objects-header-cell collapsing"></Table.HeaderCell>
                <Table.HeaderCell>Object Name</Table.HeaderCell>
                <Table.HeaderCell className="edited-objects-header-cell collapsing"></Table.HeaderCell>
                <Table.HeaderCell className="edited-objects-header-cell collapsing"></Table.HeaderCell>
                <Table.HeaderCell className="edited-objects-header-cell collapsing">{controls}</Table.HeaderCell>
            </Table.Row>
        </Table.Header>
    );
};


/**
 * A single item in edited objects table
 */
const EditedObjectItem = memo(({ objectID, parentObjects = [], parentNames = [], setConfirmState }) => {
    const dispatch = useDispatch();
    const strObjectID = objectID;
    objectID = parseInt(objectID);
    
    const editedObject = useSelector(state => state.editedObjects[objectID]);

    // Checkbox
    const isChecked = useSelector(state => state.editedObjectsUI.selectedObjectIDs.has(strObjectID));
    const checkBoxOnClick = useMemo(() => () => dispatch(toggleEditedObjectSelection(strObjectID)), [objectID]);
    const checkbox = <Checkbox checked={isChecked} onClick={checkBoxOnClick} />;
    
    // Is new icon
    const isNewColor = objectID === 0 ? "green" : "black";
    const isNewTitle = objectID === 0 ? "Object is new" : "New subobject of another object";
    const isNewIcon = objectID <= 0 ? (
        <div className="edited-objects-item-is-new-icon-container" title={isNewTitle}>
            <Icon name="plus" color={isNewColor} />
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
    let objectURL = objectID > 0 ? `/objects/${objectID}`
        : objectID == 0 ? "/objects/add" 
        : parentObjects.length > 0 ? (
            parentObjects[0] === 0 ? `/objects/add` : `/objects/${parentObjects[0]}`
        ) : null;
    let objectName = <span>{editedObject.object_name || "<unnamed>"}</span>;
    if (objectURL) objectName = (
        <Link to={objectURL}>
            {objectName}
        </Link>
    );

    // Parents
    const parents = [];
    for (let i in parentObjects) {
        const parentID = parentObjects[i];
        const URL = parentID === 0 ? "/objects/add" : `/objects/${parentID}`;
        const text = `[${parseInt(i) + 1}]`;
        
        const title = "This object is a subobject of " + (parentNames[i].length > 0 ? `"${parentNames[i]}"` : "<unnamed>");
        parents.push(<Link key={parentID} className="edited-objects-object-parent-link" to={URL} title={title}>{text}</Link>);
    }
    // const parents = parentObjects.map((parentID, i) => {
    //     const URL = parentID === 0 ? "/objects/add" : `/objects/${parentID}`;
    //     const text = `[${i + 1}]`;
    //     return <Link key={parentID} className="edited-objects-object-parent-link" to={URL} title="Parent object of this object">{text}</Link>;
    // });

    // Edited subobjects indicatior
    const editedSubobjectsIndicator = <EditedSubobjectsIndicator objectID={objectID} />;

    // Controls
    const controls = objectID >= 0 ? <EditedObjectControls objectID={objectID} setConfirmState={setConfirmState} /> : null;

    return (
        <Table.Row>
            {/* Checkbox */}
            <Table.Cell className="edited-objects-item-cell" collapsing>
                {checkbox}
            </Table.Cell>

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

            {/* Parents */}
            <Table.Cell className="edited-objects-item-cell wrappable" width="one" collapsing>
                {parents}
            </Table.Cell>

            {/* Edited subobjects indicator */}
            <Table.Cell className="edited-objects-item-cell" collapsing>
                {editedSubobjectsIndicator}
            </Table.Cell>

            {/* Controls */}
            <Table.Cell className="edited-objects-item-cell controls" collapsing>
                {controls}
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


/**
 * Selected edited object controls.
 */
 const SelectedEditedObjectControls = ({ setConfirmState }) => {
    const dispatch = useDispatch();
    const selectedEditedObjectIDs = useSelector(state => state.editedObjectsUI.selectedObjectIDs);

    const deleteCallback = useMemo(() => () => setConfirmState({
        open: true,
        content: "Delete selected edited objects?",
        onConfirm: () => dispatch(removeEditedObjects(selectedEditedObjectIDs, false))
    }));
    const deleteWithSubobjectsCallback = useMemo(() => () => setConfirmState({
        open: true,
        content: "Delete selected edited objects and their subobjects?",
        onConfirm: () => dispatch(removeEditedObjects(selectedEditedObjectIDs, true))
    }));

    const deleteControl = (
        <span className="edited-objects-item-control-container" title="Remove selected edited objects" onClick={deleteCallback}>
            <Icon name="cancel" color="black" />
        </span>
    );
    const deleteWithSubobjectsControl = (
        <span className="edited-objects-item-control-container" title="Remove selected edited objects with subobjects" onClick={deleteWithSubobjectsCallback}>
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
