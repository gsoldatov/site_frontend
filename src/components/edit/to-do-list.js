import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Icon } from "semantic-ui-react";

import { setCurrentObject } from "../../actions/object";
import { getCaretPosition } from "../../util/caret";

import StyleTDL from "../../styles/to-do-lists.css";


/*
    Edit & view components for to-do lists.
*/
export const TDLContainer = () => {
    return (
        <div className="to-do-list-container">
            <TDLMenu />
            <TDLItems />    
        </div>
    );
};


const TDLMenu = () => {
    return <div className="to-do-list-menu">Menu</div>;
};

const TDLItems = () => {
    const dispatch = useDispatch();
    const itemsRef = useRef();
    const toDoList = useSelector(state => state.objectUI.currentObject.toDoList);
    const itemOrder = toDoList.itemOrder;

    // Focus item specified in setFocusOnID
    useEffect(() => {
        if (toDoList.setFocusOnID !== -1) {
            if (toDoList.setFocusOnID === "newItem") {  // new item input (focus)
                itemsRef.current.querySelector(".new-to-do-list-item-input").focus();
            } else {    // existing item input (set caret at the end => focus)
                const index = toDoList.itemOrder.indexOf(toDoList.setFocusOnID);
                const focusedInput = itemsRef.current.childNodes[index].querySelector(".to-do-list-item-input");

                const range = document.createRange(), sel = window.getSelection();
                if (focusedInput.textContent.length > 0) {
                    console.log("IN USE EFFECT, SETTING CARET")
                    console.log(`caretPositionOnFocus = ${toDoList.caretPositionOnFocus}`)
                    console.log(`focusedInput.textContent.length = ${focusedInput.textContent.length}`)
                    const caretPosition = toDoList.caretPositionOnFocus > -1 && toDoList.caretPositionOnFocus < focusedInput.textContent.length
                        ? toDoList.caretPositionOnFocus     // set caret position to specified value or to the end of the line (default)
                        : focusedInput.textContent.length;
                    range.setStart(focusedInput.firstChild, caretPosition);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }

                focusedInput.focus();
            }

            itemUpdateCallback({ toDoList: { setFocusOnID: -1, caretPositionOnFocus: -1 }});
        }

    }, [toDoList.setFocusOnID])
    
    const itemUpdateCallback = useMemo(
        () => params => dispatch(setCurrentObject(params))
    , []);

    const itemComponents = itemOrder.map(id => {
        const item = toDoList.items[id];
        return <TDLItem key={id} id={id} updateCallback={itemUpdateCallback} {...item} />;
    });
    
    const newItem = <NewTDLItem position={itemOrder.length} updateCallback={itemUpdateCallback} /*onChange={newItemOnChange}*/ />;

    return (
        <div className="to-do-list-items" ref={itemsRef}>
            {itemComponents}
            {newItem}
        </div>
    );
};


class TDLItem extends React.PureComponent {
    constructor(props){
        super(props);
        this.inputRef = React.createRef();

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

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

    deleteItem(setFocus) {
        this.props.updateCallback({ toDoListItemUpdate: { command: "delete", id: this.props.id, setFocus }});
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
        if (e.key === "Enter") {
            e.preventDefault(); // disable adding new lines
            this.props.updateCallback({ toDoListItemUpdate: { command: "add", id: this.props.id }});
        } else if (e.key === "ArrowUp") {
            this.props.updateCallback({ toDoListItemUpdate: { command: "focusPrev", id: this.props.id, caretPositionOnFocus: getCaretPosition(this.inputRef.current) }});
        } else if (e.key === "ArrowDown") {
            this.props.updateCallback({ toDoListItemUpdate: { command: "focusNext", id: this.props.id, caretPositionOnFocus: getCaretPosition(this.inputRef.current) }});
        } else if (e.key === "Delete") {
            if (this.inputRef.current.textContent.length === 0) this.deleteItem("next");
        } else if (e.key === "Backspace") {
            if (this.inputRef.current.textContent.length === 0) {
                this.deleteItem("prev");
                e.preventDefault();     // if not prevented, the event will cause a deletion of a char in the focused item
            }
        }
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

class NewTDLItem extends React.PureComponent {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleInputChange = e => {
        this.props.updateCallback({ toDoListItemUpdate: { command: "add", position: this.props.position, item_text: e.currentTarget.textContent }})
        // this.props.onChange(this.props.position, e.currentTarget.textContent);
        e.currentTarget.textContent = "";
    };

    handleKeyDown = e => {
        if (e.keyCode == 10 || e.keyCode == 13) e.preventDefault();     // disable adding new lines
        else if (e.key === "ArrowUp") {
            this.props.updateCallback({ toDoListItemUpdate: { command: "focusPrev", focusLastItem: true }});
        }
    };
    
    render() {
        const input = <div className="new-to-do-list-item-input" ref={this.inputRef} contentEditable suppressContentEditableWarning placeholder="New item"
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