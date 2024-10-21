import React, { useRef, useEffect } from "react";
import { DropTarget } from "react-dnd";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown } from "semantic-ui-react";

import { compositeSubobjectDropdownFetch, loadCompositeSubobjectsFetch } from "../../../../../fetches/ui-objects-edit";

import debounce from "../../../../../util/debounce";
import { enumDebounceDelayRefreshMode } from "../../../../../util/enums/enum-debounce-delay-refresh-mode";


/**
 * Menu for adding new subobjects to a composite object.
 */
class AddSubobjectMenu extends React.PureComponent {
    constructor (props) {
        super(props);

        this.addNewOnClick = this.addNewOnClick.bind(this);
        this.addExistingOnClick = this.addExistingOnClick.bind(this);
    }

    // Button click handlers
    addNewOnClick() { this.props.updateCallback({ compositeUpdate: { command: "addNew", row: this.props.row, column: this.props.column }}); }
    addExistingOnClick() { this.props.setAddMenuCallback({ row: this.props.row, column: this.props.column, inputText: "", matchingIDs: [] }); }

    render() {
        const { isObjectInputDisplayed, objectID, setAddMenuCallback, updateCallback, row, column } = this.props;
        const { connectDropTarget, isDraggedOver } = this.props;
        let result;

        // Object search dropdown (additional <div> is required for wrapping component with React DND)
        if (isObjectInputDisplayed)
            result = (
                <div className="composite-object-add-menu-dropdown-container">
                    <NewObjectDropdown objectID={objectID} setAddMenuCallback={setAddMenuCallback} updateCallback={updateCallback} row={row} column={column} />
                </div>
            );

        // "Add New" + "Add Existing" buttons
        else 
            result = (
                <div className="composite-subobject-add-menu-button-container">
                    <Button color="blue" onClick={this.addNewOnClick} className="composite-subobject-add-menu-button">
                        Add New
                    </Button>
                    <Button color="teal" onClick={this.addExistingOnClick} className="composite-subobject-add-menu-button">
                        Add Existing
                    </Button>
                </div>
            );

        // Menu classname
        let menuClassName = "composite-subobject-card add-menu";
        if (isDraggedOver) menuClassName += " is-dragged-over";

        return connectDropTarget(
            <div className={menuClassName}>
                {result}
            </div>
        );
    }
}

// Drop specification, collecting functions and wrapping
const dropTargetSpec = {
    drop: props => ({ objectID: props.objectID, newColumn: props.column, newRow: props.row }),
    canDrop: (props, monitor) => props.objectID === monitor.getItem().objectID
};

const dropTargetCollect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isDraggedOver: monitor.canDrop() && monitor.isOver()
});

export const DroppableAddSubobjectMenu = DropTarget("composite subobject", dropTargetSpec, dropTargetCollect)(AddSubobjectMenu);


/**
 * Existing subobjects search dropdown.
 */
const NewObjectDropdown = ({ objectID, setAddMenuCallback, updateCallback, row, column }) => {
    const dispatch = useDispatch();

    // Input state & dropdown options
    const inputState = useSelector(state=> state.objectUI.addCompositeSubobjectMenu);
    const objectsStore = useSelector(state => state.objects);
    const options = inputState.matchingIDs.map(id => ({ key: id, text: objectsStore[id].object_name, value: id }));
    
    // Existing subobject IDs
    const existingIDs = useSelector(state => {
        // Existing subobjects
        const result = Object.keys(state.editedObjects[objectID].composite.subobjects).map(subobjectID => parseInt(subobjectID)).filter(subobjectID => subobjectID > 0);
        
        // Composite object itself
        if (objectID > 0) result.push(objectID);

        return result;
    });

    // Close & reset input function
    const closeAndResetInput = () => { setAddMenuCallback({ row: -1, column: -1, inputText: "", matchingIDs: [] }) };
    
    // Dropdown onBlur event handler
    const handleBlur = (e, data) => {
        closeAndResetInput();
    };

    // Dropdown Esc keypress event handler
    const handleKeyDown = e => {
        if (e.key === "Escape") {
            closeAndResetInput();
        }
    };

    // Search text change handlers (updates state & runs a delayed fetch to get dropdown items)
    const _onSearchChangeDelayed = useRef(debounce(params => dispatch(compositeSubobjectDropdownFetch(params))
                                    , 250, enumDebounceDelayRefreshMode.onCall)).current;
    const handleSearchChange = (e, data) => {
        setAddMenuCallback({ inputText: data.searchQuery });
        _onSearchChangeDelayed({ queryText: data.searchQuery, existingIDs });
    };

    // Object selection handler
    const handleChange = (e, data) => {
        // Reset input
        closeAndResetInput();
        // Add subobject
        updateCallback({ compositeUpdate: { command: "addExisting", subobjectID: data.value, row, column }});
        // Fetch subobject data & add it to state.editedObjects
        dispatch(loadCompositeSubobjectsFetch(objectID));
    };

    // Focus the input after it's rendered
    const inputRef = useRef();
    useEffect(() => {
        if (inputRef.current) inputRef.current.handleFocus();
    }, []);

    return (
        <Dropdown search selectOnNavigation={false} selection selectOnBlur={false} className="composite-object-add-menu-dropdown" ref={inputRef}
            placeholder="Enter object name"
            open={options.length > 0}

            searchQuery={inputState.inputText}
            options={options}

            onSearchChange={handleSearchChange}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
        />
    );
};
