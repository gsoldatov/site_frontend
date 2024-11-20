import React from "react";
import { DragSource, DropTarget } from "react-dnd";
import { Icon } from "semantic-ui-react";

import { StateControl, stateControlParams } from "./state-control";
import { Comment } from "./comment";
import { ExpandControl } from "./expand-control";
import { ItemDropzone } from "./item-dropzone";

import { ToDoListSelectors } from "../../../../../store/selectors/data/objects/to-do-list";
import * as caret from "../../../../../util/caret";   // wrapped into an object to make functions mockable in tests
import { getElementHeightInLines } from "../../../../../util/element-styles";


/**
 * To-do list item component.
 */
class TDLItem extends React.PureComponent {
    constructor(props){
        super(props);
        this.inputRef = React.createRef();

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.deleteItem = this.deleteItem.bind(this);
        this.deleteItemWithChildren = this.deleteItemWithChildren.bind(this);
        this.setDropIndent = this.setDropIndent.bind(this);

        this.handleInputFocus = this.handleInputFocus.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.handleInputMouseEnter = this.handleInputMouseEnter.bind(this);
        this.handleInputMouseLeave = this.handleInputMouseLeave.bind(this);
        this.handleItemMouseEnter = this.handleItemMouseEnter.bind(this);
        this.handleItemMouseLeave = this.handleItemMouseLeave.bind(this);

        this.state = {
            initialItemText: props.item_text,
            forceInitialItemTextUpdate: 0,  // a value which is updated with initialItemText to guarantee a rerender of item text input innerHTML with the correct text after edited object state reset
            isItemHovered: false,
            isInputHovered: false,
            isInputFocused: false
        };
    }

    deleteItem(setFocus) { this.props.updateCallback({ toDoListItemUpdate: { command: "deleteItem", itemID: this.props.id, setFocus }}); }
    deleteItemWithChildren() { this.props.updateCallback({ toDoListItemUpdate: { command: "deleteItem", itemID: this.props.id, deleteChildren: true }}); }
    setDropIndent(newIndent) { this.props.updateCallback({ toDoList: { draggedOver: this.props.id, dropIndent: newIndent }}); }

    // Container event handlers
    handleItemMouseEnter() { this.setState({ ...this.state, isItemHovered: true }); }
    handleItemMouseLeave() { this.setState({ ...this.state, isItemHovered: false, isInputHovered: false }); }   // also update input's isHovered, because state changes are not properly applied when its onMouseLeave handler is run at the same time with this one

    // Input event handlers
    handleInputMouseEnter() { this.setState({ ...this.state, isItemHovered: true, isInputHovered: true }); }    // also update item's isHovered, because state changes are not properly applied when its onMouseEnter handler is run at the same time with this one
    handleInputMouseLeave() { this.setState({ ...this.state, isInputHovered: false }); }
    handleInputFocus() { this.setState({ ...this.state, isInputFocused: true }); }
    handleInputBlur() { this.setState({ ...this.state, isInputFocused: false }); }

    handlePaste(e) {
        // Add pasted input as a single text line
        e.preventDefault();
        // const text = e.clipboardData.getData('text/plain').replace(/[\n\r]+/g, " ");     // Pastes as a single line
        let text = e.clipboardData.getData('text/plain')    // Pastes from clipboard a single line after trimming each line
            .split("\n")
            .map(line => line.trim())
            .join(" ");
        document.execCommand('insertText', false, text);
    }

    handleInputChange(e) {
        // NOTE: this implementation bugs out when adding a trailing space in the item or entering text into a cleared with backspace key press item;
        // currently disabled & replaced with updated caret setters & getters, which accomodate for caret being placed into contenteditable's children.
        //
        // Pasting text into contenteditable <div> creates an additional text child.
        // Having more than one child for input interferes with manual caret position setting, 
        // which may attempt to set it at the position, which is out of range.
        // E.g.:
        // 1) let initial text = "abc", it renders fully in a single text node child of input;
        // 2) after pasting text "d" in the end of the input, it will have two text children: "abc" and "d",
        //    the caret moves to position 4 (after "d");
        // 3) If the caret is moved to a neigboring item with >= 4 total characters, and then returned back,
        //    the focus handler in <TDLItems> will attempt to place the caret on pos 4 in the first child of the initial input,
        //    which has only 3 characters, and thus cause an out of range error.
        //
        // To avoid this, input's text children are squashed into one any time there's more than one of them.
        // const input = this.inputRef.current;
        // while (input.childNodes.length > 1) {
        //     input.childNodes[0].textContent += input.childNodes[1].textContent;
        //     input.removeChild(input.childNodes[1]);
        // }

        // Update state
        this.props.updateCallback({ toDoListItemUpdate: { command: "updateItem", itemID: this.props.id, item_text: e.currentTarget.textContent }}); 
    };

    handleKeyDown(e) {
        // On `Enter` split current item into two and focus the second (or add a new empty item and focus it if previous failed)
        if (e.key === "Enter") {
            e.preventDefault(); // disable adding new lines
            const splitText = caret.getSplitText(this.inputRef.current);
            if (typeof(splitText) === "object") 
                this.props.updateCallback({ toDoListItemUpdate: { command: "splitItem", itemID: this.props.id, ...splitText }});
            else 
                this.props.updateCallback({ toDoListItemUpdate: { command: "addItem", previousItemID: this.props.id }});
        }

        // On `ArrowUp` move caret to a previous line in the item
        // or focus the previous item (including when new item input is focused)
        //
        // NOTE: caret position in a new item is calculated is calculated in characters, 
        // which may give some inconsistency for old and new caret offset widths in px.
        else if (e.key === "ArrowUp") {
            if (!e.shiftKey) {
                const [line, offset] = caret.getCaretPositionData(this.inputRef.current);
                if (line === 0 || line === -1) {
                    e.preventDefault();
                    // Always move to the last position in the previous item (moving to the same position would require to calculate the correct position in the last row)
                    this.props.updateCallback({ toDoListItemUpdate: { command: "focusPrevItem", itemID: this.props.id, caretPositionOnFocus: Number.MAX_SAFE_INTEGER }});
                }
            }
        }

        // On `ArrowUp` move caret to a next line in the item
        // or focus the next item (including new item input)
        // NOTE: caret position in a new item is calculated is calculated in characters, 
        // which may give some inconsistency for old and new caret offset widths in px.
        else if (e.key === "ArrowDown") {
            if (!e.shiftKey) {
                const [line, offset] = caret.getCaretPositionData(this.inputRef.current);
                if (line >= getElementHeightInLines(this.inputRef.current) - 1 || line === -1) {
                    e.preventDefault();
                    this.props.updateCallback({ toDoListItemUpdate: { command: "focusNextItem", itemID: this.props.id, caretPositionOnFocus: offset /*0*/ }});
                }
            }
        }

        // On `Backspace`:
        // - use default handler if a range of text is currently selected;
        // - use custom handler, which:
        //     - deletes a char before the caret, if there is one;
        //     - merges current item with the previous one, is the caret was placed at the start of current item.
        else if (e.key === "Backspace") {
            if (caret.isRangeSelected()) return;
            
            const splitText = caret.getSplitText(this.inputRef.current);
            if (splitText !== null) {   // merge item with previous
                if (splitText.before.length === 0) {
                    this.props.updateCallback({ toDoListItemUpdate: { command: "mergeItemWithPrev", itemID: this.props.id }});
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

        // On `Delete`:
        // - use default handler if a range of text is currently selected;
        // - use custom handler, which:
        //     - deletes a char after the caret, if there is one;
        //     - merges current item with the next one, is the caret was placed at the end of current item.
        else if (e.key === "Delete") {
            if (caret.isRangeSelected()) return;

            const splitText = caret.getSplitText(this.inputRef.current);
            if (splitText !== null) {   // merge item with next
                if (splitText.after.length === 0) {
                    this.props.updateCallback({ toDoListItemUpdate: { command: "mergeItemWithNext", itemID: this.props.id }});
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

        // On `Tab`/ `Shift + Tab` increase/decrease indent of the item and its children by 1.
        else if (e.key === "Tab") {
            e.preventDefault();
            if (e.shiftKey) this.props.updateCallback({ toDoListItemUpdate: { command: "setIndent", id: this.props.id, decrease: true }});
            else this.props.updateCallback({ toDoListItemUpdate: { command: "setIndent", id: this.props.id, increase: true }});
        }

        // On `F1` toggle item state.
        else if (e.key === "F1") {
            e.preventDefault();
            this.props.updateCallback({ toDoListItemUpdate: { command: "updateItem", itemID: this.props.id, 
                item_state: ToDoListSelectors.nextItemState(this.props.item_state) }});
        }

        // On `F2` expand/collapse item.
        else if (e.key === "F2") {
            e.preventDefault();
            this.props.updateCallback({ toDoListItemUpdate: { command: "updateItem", itemID: this.props.id, is_expanded: !this.props.is_expanded }});
        }
    };

    componentDidUpdate(prevProps) {
        // Reset inner HTML of item text input after edited object was reset
        if (this.props.updateInnerHTMLRequired && !prevProps.updateInnerHTMLRequired) { // prevProps should be checked to avoid multiple reset while parent component is not rerendered
            this.setState((state, props) => ({ initialItemText: props.item_text, forceInitialItemTextUpdate: Math.random() }));
        }
    }

    render() {
        const { id, item_state, commentary, indent, is_expanded, updateCallback, hasChildren, dropIndent, isParentDragged, maxIndent, updateInnerHTMLRequired } = this.props;
        const { connectDragSource, connectDropTarget, isDragging, isDraggedOver } = this.props;

        // Don't render the element which is being dragged
        if (isDragging || isParentDragged) return null;

        // Dropzones and additional space when item item is being dragged over
        const dropZones = isDraggedOver && <ItemDropzone currentIndent={dropIndent} maxIndent={maxIndent} indentUpdateCallback={this.setDropIndent} />;

        // Indent space
        const indentSpace = <div className={indentClassNames[indent]} />;

        // Left menu
        const expandControl = hasChildren && <ExpandControl id={id} is_expanded={is_expanded} updateCallback={updateCallback} />;
        const leftMenu = (
            <div className="to-do-list-left-menu">
                {expandControl}
                <StateControl id={id} state={item_state} updateCallback={updateCallback} />
            </div>
        );

        // Input
        const { inputCSSClass } = stateControlParams[item_state];
        const input = <div className={inputCSSClass} ref={this.inputRef} contentEditable suppressContentEditableWarning spellCheck={false}
                        onInput={this.handleInputChange} onKeyDown={this.handleKeyDown} onFocus={this.handleInputFocus} onBlur={this.handleInputBlur}
                        onMouseEnter={this.handleInputMouseEnter} onMouseLeave={this.handleInputMouseLeave}
                        onPaste={this.handlePaste}
                        dangerouslySetInnerHTML={{ __html: this.state.initialItemText }}        // setting item_text as inner content of <div> results
                                                                                                // in the cursor being moved to the beginning of the <div> on every input
                        key={this.state.forceInitialItemTextUpdate}  />;

        // Right menu
        const itemIsFocusedOrHovered = this.state.isInputFocused || this.state.isItemHovered;

        const comment = (itemIsFocusedOrHovered || commentary.length > 0) && (
            <Comment id={id} commentary={commentary} updateCallback={updateCallback} updateInnerHTMLRequired={updateInnerHTMLRequired} />
        );

        const deleteButton = itemIsFocusedOrHovered && (
            <Icon className="to-do-list-item-button" name="remove circle" title="Delete item" onClick={this.deleteItem} />
        );

        const deleteAllChildren = itemIsFocusedOrHovered && hasChildren && (
            <Icon className="to-do-list-item-button" name="remove circle" color="red" title="Delete item and its children" onClick={this.deleteItemWithChildren} />
        );
        
        const rightMenu = (
            <div className="to-do-list-right-menu">
                {comment}
                {deleteButton}
                {deleteAllChildren}
            </div>
        );

        // Item container classname
        let itemContainerClassName = "to-do-list-item-container";
        if (this.state.isItemHovered && !this.state.isInputHovered) itemContainerClassName += " is-draggable";
        
        // Render component with or without DnD enabled
        const result = (
            <div className={itemContainerClassName}>
                {dropZones}
                <div className="to-do-list-item" onMouseEnter={this.handleItemMouseEnter} onMouseLeave={this.handleItemMouseLeave}>
                    <div className="to-do-list-item-id">{id}</div>
                    {indentSpace}
                    {leftMenu}
                    {input}
                    {rightMenu}
                </div>
            </div>
        );

        // Disable dragging when hovering over input to allow text interaction (but still allow dragged items to be dropped)
        if (this.state.isInputHovered) return connectDropTarget(result);
        return connectDropTarget(connectDragSource(result));
    }
}


// indent class names
const indentBaseClassName = "to-do-list-item-indent";
export const indentClassNames = {
    "0": indentBaseClassName,
    "1": indentBaseClassName + " one",
    "2": indentBaseClassName + " two",
    "3": indentBaseClassName + " three",
    "4": indentBaseClassName + " four",
    "5": indentBaseClassName + " five"
};


// Drag & drop specifications, collecting functions and wrapping
const dragSourceSpec = {
    beginDrag: props => {
        props.updateCallback({ toDoListItemUpdate: { command: "startItemDrag", itemID: props.id }});
        return { objectID: props.objectID, itemID: props.id };
    },
    endDrag: (props, monitor, component) => {
        props.updateCallback({ toDoListItemUpdate: { command: "endItemDrag" }});
        component.setState({...component.state, initialItemText: props.item_text });    // inner HTML value must be updated or it will render the item_text passed in the component's constructor
        if (!monitor.didDrop()) return;

        const dropResult = monitor.getDropResult();
        props.updateCallback({ toDoListItemUpdate: { command: "moveItems", movedID: props.id, targetID: dropResult.itemID, targetLastItem: dropResult.targetLastItem }});
    },
    canDrag: props => props.canDrag
};

const dragSourceCollect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
});


const dropTargetSpec = {
    drop: props => ({ objectID: props.objectID, itemID: props.id }),
    canDrop: (props, monitor) => props.objectID === monitor.getItem().objectID
};

const dropTargetCollect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isDraggedOver: monitor.canDrop() && monitor.isOver()
});


export const DraggableTDLItem = DropTarget("to-do item", dropTargetSpec, dropTargetCollect)(DragSource("to-do item", dragSourceSpec, dragSourceCollect)(TDLItem));
