import React from "react";
import { Icon } from "semantic-ui-react";

import { StateControl, StateControlButton, stateControlParams } from "./state-control";
import { getCaretPosition, getSplitText } from "../../../util/caret";


export class TDLItem extends React.PureComponent {
    constructor(props){
        super(props);
        this.inputRef = React.createRef();

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.deleteItem = this.deleteItem.bind(this);

        this.handleInputFocus = this.handleInputFocus.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.handleItemMouseEnter = this.handleItemMouseEnter.bind(this);
        this.handleItemMouseLeave = this.handleItemMouseLeave.bind(this);

        this.state = {
            initialItemText: props.item_text,
            isItemHovered: false,
            isInputFocused: false
        };
    }

    deleteItem(setFocus) { this.props.updateCallback({ toDoListItemUpdate: { command: "delete", id: this.props.id, setFocus }}); }

    // Container event handlers
    handleItemMouseEnter() { this.setState({ ...this.state, isItemHovered: true }); }
    handleItemMouseLeave() { this.setState({ ...this.state, isItemHovered: false }); }

    // Input event handlers
    handleInputFocus() { this.setState({ ...this.state, isInputFocused: true }); }
    handleInputBlur() { this.setState({ ...this.state, isInputFocused: false }); }
    handleInputChange = e => { this.props.updateCallback({ toDoListItemUpdate: { command: "update", id: this.props.id, item_text: e.currentTarget.textContent }}); };

    handleKeyDown = e => {
        // On `Enter` split current item into two and focus the second (or add a new empty item and focus it if previous failed)
        if (e.key === "Enter") {
            e.preventDefault(); // disable adding new lines
            const splitText = getSplitText(this.inputRef.current);
            if (typeof(splitText) === "object") 
                this.props.updateCallback({ toDoListItemUpdate: { command: "split", id: this.props.id, ...splitText }});
            else 
                this.props.updateCallback({ toDoListItemUpdate: { command: "add", id: this.props.id }});
        }

        // On `ArrowUp` focus the previous item (including when new item input is focused)
        else if (e.key === "ArrowUp") {
            this.props.updateCallback({ toDoListItemUpdate: { command: "focusPrev", id: this.props.id, caretPositionOnFocus: getCaretPosition(this.inputRef.current) }});
        }

        // On `ArrowUp` focus the next item (including new item input)
        else if (e.key === "ArrowDown") {
            this.props.updateCallback({ toDoListItemUpdate: { command: "focusNext", id: this.props.id, caretPositionOnFocus: getCaretPosition(this.inputRef.current) }});
        }
        
        // On `Backspace` delete a char before the caret if there is one or do one of the below:
        // 1) merge current item with the previous one if no characters remain before the caret;
        // 2) delete the current item if its text is empty.
        else if (e.key === "Backspace") {
            const splitText = getSplitText(this.inputRef.current);
            if (splitText !== null) {   // merge item with previous
                if (splitText.before.length === 0) {
                    this.props.updateCallback({ toDoListItemUpdate: { command: "mergeWithPrev", id: this.props.id }});
                    e.preventDefault();     // backspace key press default handlers are run after this event
                }
            }
            else {  // fallback to item delete if item text split failed
                if (this.inputRef.current.textContent.length === 0) {
                    this.deleteItem("prev");
                    e.preventDefault();     // backspace key press default handlers are run after this event
                }
            }
        }
        
        // On `Delete` delete a char after the caret if there is one or do one of the below:
        // 1) merge current item with the next one if no characters remain after the caret;
        // 2) delete the current item if its text is empty.
        else if (e.key === "Delete") {
            const splitText = getSplitText(this.inputRef.current);
            if (splitText !== null) {   // merge item with next
                if (splitText.after.length === 0) {
                    this.props.updateCallback({ toDoListItemUpdate: { command: "mergeWithNext", id: this.props.id }});
                    e.preventDefault();
                }
            }
            else {  // fallback to item delete if item text split failed
                if (this.inputRef.current.textContent.length === 0) {
                    this.deleteItem("next");
                    e.preventDefault();
                }
            }
        }
    };

    render() {
        const { id, item_state, updateCallback } = this.props;
        const { inputCSSClass } = stateControlParams[item_state];

        // Left menu
        const leftMenu = (
            <div className="to-do-list-left-menu">
                <StateControlButton state="active" />
                <StateControl id={id} state={item_state} updateCallback={updateCallback} />
            </div>
        );

        // Input
        const input = <div className={inputCSSClass} ref={this.inputRef} contentEditable suppressContentEditableWarning spellCheck={false}
                        onInput={this.handleInputChange} onKeyDown={this.handleKeyDown} onFocus={this.handleInputFocus} onBlur={this.handleInputBlur}
                        dangerouslySetInnerHTML={{ __html: this.state.initialItemText }} />;    // setting item_text as inner content of <div> results
                                                                                                // in the cursor being moved to the beginning of the <div> on every input
        
        // Right menu
        const deleteButton = (this.state.isInputFocused || this.state.isItemHovered) && (
            <Icon className="to-do-list-item-button" name="remove circle" title="Delete item" onClick={this.deleteItem} />
        );

        const rightMenu = (
            <div className="to-do-list-right-menu">
                {deleteButton}
            </div>
        );

        return (
            <div className="to-do-list-item"  onMouseEnter={this.handleItemMouseEnter} onMouseLeave={this.handleItemMouseLeave}>
                {leftMenu}
                {input}
                {rightMenu}
            </div>
        );
    }
}
