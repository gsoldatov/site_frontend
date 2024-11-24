import React, { memo, useMemo } from "react";
import { Checkbox, Icon, Label, Table } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { removeEditedObjects, clearEditedObjects } from "../../../reducers/data/edited-objects";
import { toggleObjectsEditedSelection, toggleObjectsEditedSelectAll } from "../../../reducers/ui/objects-edited";
import { objectTypeOptions } from "../../../store/types/ui/general/object-type";


/**
 * /objects/edited page table with edited objects.
 */
export const ObjectsEditedTable = ({ setConfirmState }) => {
    const editedObjects = useSelector(state => state.editedObjects);
        
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
    
    return (
        <Table striped unstackable className="edited-objects-table">
            <ObjectsEditedTableHeader setConfirmState={setConfirmState} />
            <Table.Body>
                {items}
            </Table.Body>
        </Table>
    );
};


/**
 * Edited objects' table header.
 */
const ObjectsEditedTableHeader = ({ setConfirmState }) => {
    const dispatch = useDispatch();
    
    // Toggle all selection checkbox
    const isChecked = useSelector(state => state.objectsEditedUI.selectedObjectIDs.size === Object.keys(state.editedObjects).length);
    const isIndeterminate = useSelector(state => state.objectsEditedUI.selectedObjectIDs.size < Object.keys(state.editedObjects).length && state.objectsEditedUI.selectedObjectIDs.size > 0);
    const checkBoxOnClick = useMemo(() => () => dispatch(toggleObjectsEditedSelectAll()), []);
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
    objectID = parseInt(objectID);
    
    const editedObject = useSelector(state => state.editedObjects[objectID]);

    // Checkbox
    const isChecked = useSelector(state => state.objectsEditedUI.selectedObjectIDs.has(objectID));
    const checkBoxOnClick = useMemo(() => () => dispatch(toggleObjectsEditedSelection(objectID)), [objectID]);
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
    const typeEnum = objectTypeOptions[editedObject.object_type];
    const objectTypeIcon = (
        <div className="edited-objects-item-object-type-icon-container" title={typeEnum.name}>
            <Icon name={typeEnum.icon} />
        </div>
    );

    // Object name and page link
    let objectURL = objectID > 0 ? `/objects/edit/${objectID}`
        : objectID == 0 ? "/objects/edit/new" 
        : parentObjects.length > 0 ? (
            parentObjects[0] === 0 ? `/objects/edit/new` : `/objects/edit/${parentObjects[0]}`
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
        const URL = parentID === 0 ? "/objects/edit/new" : `/objects/edit/${parentID}`;
        const text = `[${parseInt(i) + 1}]`;
        
        const title = "This object is a subobject of " + (parentNames[i].length > 0 ? `"${parentNames[i]}"` : "<unnamed>");
        parents.push(<Link key={parentID} className="edited-objects-object-parent-link" to={URL} title={title}>{text}</Link>);
    }
    // const parents = parentObjects.map((parentID, i) => {
    //     const URL = parentID === 0 ? "/objects/edit/new" : `/objects/edit/${parentID}`;
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
            <Table.Cell className="edited-objects-item-cell object-name">
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
        onConfirm: () => dispatch(removeEditedObjects([objectID]))
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
    const selectedEditedObjectIDs = [...useSelector(state => state.objectsEditedUI.selectedObjectIDs)];

    const deleteAllCallback = useMemo(() => () => setConfirmState({
        open: true,
        content: "Delete all edited objects?",
        onConfirm: () => dispatch(clearEditedObjects())
    }));
    const deleteCallback = useMemo(() => () => setConfirmState({
        open: true,
        content: "Delete selected edited objects?",
        onConfirm: () => dispatch(removeEditedObjects(selectedEditedObjectIDs))
    }));
    const deleteWithSubobjectsCallback = useMemo(() => () => setConfirmState({
        open: true,
        content: "Delete selected edited objects and their subobjects?",
        onConfirm: () => dispatch(removeEditedObjects(selectedEditedObjectIDs, true))
    }));

    const deleteAllControl = (
        <span className="edited-objects-item-control-container" title="Remove all edited objects" onClick={deleteAllCallback}>
            <Icon name="remove circle" color="black" />
        </span>
    );
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
            {deleteAllControl}
            {deleteControl}
            {deleteWithSubobjectsControl}
        </>
    );
};
