import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Icon } from "semantic-ui-react";

import { setCurrentObject } from "../../actions/object";

import StyleTDL from "../../styles/to-do-lists.css";


/*
    Edit & view components for to-do lists.
*/
export const ToDoListContainer = () => {
    return (
        <div className="to-do-list-container">
            <ToDoListMenu />
            <ToDoListItems />    
        </div>
    );
};


const ToDoListMenu = () => {
    return <div className="to-do-list-menu">Menu</div>;
};

const ToDoListItems = () => {
    const dispatch = useDispatch();
    const toDoList = useSelector(state => state.objectUI.currentObject.toDoList);
    const items = toDoList.items, itemOrder = toDoList.itemOrder;
    
    const newItemOnChange = useMemo(
        () => (position, item_text) => dispatch(setCurrentObject({ toDoListItemUpdate: { command: "add", position, item_text }}))
    , []);
    const itemUpdateCallback = useMemo(
        () => params => dispatch(setCurrentObject(params))
    , []);

    const itemComponents = itemOrder.map(id => {
        const item = toDoList.items[id];
        return <ToDoListItem key={id} id={id} updateCallback={itemUpdateCallback} setFocus={id === toDoList.setFocusOnID} {...item} />;
    });
    
    const newItem = <NewToDoListItem position={itemOrder.length} onChange={newItemOnChange} />;

    return (
        <div className="to-do-list-items">
            {itemComponents}
            {newItem}
        </div>
    );
};


class ToDoListItem extends React.PureComponent {
    constructor(props){
        super(props);
        this.inputRef = React.createRef();

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.focusInput = this.focusInput.bind(this);
        this.deleteItem = this.deleteItem.bind(this);

        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleOnMouseEnter = this.handleOnMouseEnter.bind(this);
        this.handleOnMouseLeave = this.handleOnMouseLeave.bind(this);

        this.state = {
            initialItemText: props.item_text,
            isInputFocused: false,
            isMouseOver: false
        };
    }

    componentDidMount() {
        this.focusInput();
    }

    componentDidUpdate() {
        this.focusInput();
    }

    // Common event handlers
    focusInput() {
        if (this.props.setFocus) {
            var range = document.createRange();     // Set cursor position at the end of the item
            var sel = window.getSelection();

            range.setStart(this.inputRef.current, 1);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            this.inputRef.current.focus();  // Focus item and update the state
            this.props.updateCallback({ toDoList: { setFocusOnID: -1 }});
        }
    }

    deleteItem() {
        this.props.updateCallback({ toDoListItemUpdate: { command: "delete", id: this.props.id }});
    }

    // Container event handlers
    handleOnMouseEnter() {
        this.setState({ ...this.state, isMouseOver: true });
    }

    handleOnMouseLeave() {
        this.setState({ ...this.state, isMouseOver: false });
    }

    // Input event handlers
    handleFocus() {
        this.setState({ ...this.state, isInputFocused: true });
    }

    handleBlur() {
        this.setState({ ...this.state, isInputFocused: false });
    }

    handleInputChange = e => {
        this.props.updateCallback({ toDoListItemUpdate: { command: "update", id: this.props.id, item_text: e.currentTarget.textContent }});
    };

    handleKeyDown = e => {
        if (e.keyCode == 10 || e.keyCode == 13) e.preventDefault(); // disable adding new lines
    };

    render() {
        // const { item_text, setFocus } = this.props;

        // Left menu
        const leftMenu = (
            <div className="to-do-list-left-menu">
                <Icon name="plus" />
            </div>
        );

        // Input
        const input = <div className="to-do-list-item-input" ref={this.inputRef} contentEditable suppressContentEditableWarning 
                        onInput={this.handleInputChange} onKeyDown={this.handleKeyDown} onFocus={this.handleFocus} onBlur={this.handleBlur}
                        dangerouslySetInnerHTML={{ __html: this.state.initialItemText }} />;    // setting item_text as inner content of <div> results
                                                                                                // in the cursor being moved to the beginning of the <div> on every input
        
        //  Right menu
        const deleteButton = (this.state.isInputFocused || this.state.isMouseOver) && (
            <Icon className="to-do-list-item-button" name="cancel" title="Delete item" onClick={this.deleteItem} />
        );

        const rightMenu = (
            <div className="to-do-list-right-menu">
                {deleteButton}
            </div>
        );

        return (
            <div className="to-do-list-item"  onMouseEnter={this.handleOnMouseEnter} onMouseLeave={this.handleOnMouseLeave}>
                {leftMenu}
                {input}
                {rightMenu}
            </div>
        );
    }
}

class NewToDoListItem extends React.PureComponent {
    constructor(props) {
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleInputChange = e => {
        this.props.onChange(this.props.position, e.currentTarget.textContent);
        e.currentTarget.textContent = "";
    };

    handleKeyDown = e => {
        if (e.keyCode == 10 || e.keyCode == 13) e.preventDefault();     // disable adding new lines
    };
    
    render() {
        const input = <div className="new-to-do-list-item-input" contentEditable suppressContentEditableWarning placeholder="New item"
                onInput={this.handleInputChange} onKeyDown={this.handleKeyDown} >{""}</div>;
        
        return (
            <div className="to-do-list-item">
                {input}
            </div>
        );
    }
}


/*
    TODO
    - key binds;
    ???

     - update `itemOrder` and `key` props if:
        ? setCurrentObject is run with object_type or new object_type === "to_do_list":
            ? run after other updates were implemented;
        - when an item is added, generate a `key` for it;
        - when an item is deleted, remove the key from it `itemOrder`;
        - one of:
            - A:
                - when object data is loaded from backend for a to-do list, generate `itemOrder` list (and other frontend-only props) and convert array of items into an object;
                - when saving data to backend, convert item object into array using `itemOrder`;
            - B:
                - when `items` is passed as a prop for toDoList in `SetCurrentObject`, convert it to an object with `key`: `item` structure and generate `itemOrder`;
                - when saving data to backend, convert item object into array using `itemOrder`;
                - when saving data to state storage, convert item object into array using `itemOrder`;
*/