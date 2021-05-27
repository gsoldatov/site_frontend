import React, { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dropdown } from "semantic-ui-react";

import { compositeSubobjectDropdownFetch, loadCompositeSubobjectsFetch } from "../../../fetches/ui-object";

import intervalWrapper from "../../../util/interval-wrapper";


/*
    Menu for adding new subobjects to a composite object.
*/
export class AddSubobjectMenu extends React.PureComponent {
    constructor (props) {
        super(props);

        this.addNewOnClick = this.addNewOnClick.bind(this);
        this.addExistingOnClick = this.addExistingOnClick.bind(this);
    }

    addNewOnClick() { this.props.updateCallback({ compositeUpdate: { command: "addNew", row: this.props.row, column: this.props.column }}); }
    addExistingOnClick() { this.props.setAddMenuCallback({ row: this.props.row, column: this.props.column, inputText: "", matchingIDs: [] }); }

    render() {
        const { isObjectInputDisplayed, objectID, setAddMenuCallback, updateCallback, row, column } = this.props;

        if (isObjectInputDisplayed) {
            return (
                <NewObjectDropdown objectID={objectID} setAddMenuCallback={setAddMenuCallback} updateCallback={updateCallback} row={row} column={column} />
            );
        }

        return (
            <div className="composite-subobject-add-menu-container">
                <Button onClick={this.addNewOnClick}>
                    Add a New Subobject
                </Button>
                <Button onClick={this.addExistingOnClick}>
                    Add an Existing Subobject
                </Button>
            </div>
        );
    }
}


const NewObjectDropdown = ({ objectID, setAddMenuCallback, updateCallback, row, column }) => {
    const dispatch = useDispatch();

    // Input state & dropdown options
    const inputState = useSelector(state=> state.objectUI.addCompositeSubobjectMenu);
    const objectsStore = useSelector(state => state.objects);
    const options = inputState.matchingIDs.map(id => ({ key: id, text: objectsStore[id].object_name, value: id }));
    
    // Existing subobject IDs
    const existingIDs = useSelector(
        state => Object.keys(state.editedObjects[objectID].composite.subobjects)
        .map(subobjectID => parseInt(subobjectID)).filter(subobjectID => subobjectID > 0)
    );

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
    const _onSearchChangeDelayed = useRef(intervalWrapper(params => dispatch(compositeSubobjectDropdownFetch(params))
                                    , 250, true)).current;
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
