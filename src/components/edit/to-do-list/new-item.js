import React from "react";
import { DropTarget } from "react-dnd";
import { Icon } from "semantic-ui-react";

import { indentClassNames } from "./item";


class NewTDLItem extends React.PureComponent {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleInputChange = e => {
        this.props.updateCallback({ toDoListItemUpdate: { command: "add", position: this.props.position, item_text: e.currentTarget.textContent, indent: this.props.indent }})
        e.currentTarget.textContent = "";
    };

    handleKeyDown = e => {
        // On `Enter` keypress, don't add a new line into <div>
        if (e.keyCode == 10 || e.keyCode == 13) e.preventDefault();

        // On `ArrowUp` keypress, focus last existing item
        else if (e.key === "ArrowUp") {
            this.props.updateCallback({ toDoListItemUpdate: { command: "focusPrev", focusLastItem: true }});
        }

        // On `Tab`/ `Shift + Tab` increase/decrease indent of the item and its children by 1.
        else if (e.key === "Tab") {
            e.preventDefault();
            if (e.shiftKey) this.props.updateCallback({ toDoListItemUpdate: { command: "setIndent", id: "newItem", decrease: true }});
            else this.props.updateCallback({ toDoListItemUpdate: { command: "setIndent", id: "newItem", increase: true }});
        }
    };
    
    render() {
        const { connectDropTarget, isHovered } = this.props;
        const { indent } = this.props;

        // Additional element when hovered
        const onHoverSpace = isHovered && (
            <div className="to-do-list-item-on-hover-space" />
        )

        // Indent space
        const indentSpace = <div className={indentClassNames[indent]} />;

        // Left menu
        const leftMenu = (
            <div className="to-do-list-left-menu">
                <div className="to-do-list-item-state-menu">
                    <Icon className="to-do-list-item-button new" name="square outline" />
                </div>
            </div>
        );
        
        // Input
        const input = <div className="to-do-list-item-input new" ref={this.inputRef} contentEditable suppressContentEditableWarning placeholder="New item"
                onInput={this.handleInputChange} onKeyDown={this.handleKeyDown} >{""}</div>;
        
        return connectDropTarget(
            <div className="to-do-list-item-container">
                {onHoverSpace}
                <div className="to-do-list-item">
                    {indentSpace}
                    {leftMenu}
                    {input}
                </div>
            </div>
        );
    }
}


// Drop specification, collecting functions and wrapping
const dropTargetSpec = {
    drop: props => ({ objectID: props.objectID, targetLastItem: true }),
    canDrop: (props, monitor) => props.objectID === monitor.getItem().objectID
};

const dropTargetCollect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isHovered: monitor.canDrop() && monitor.isOver()
});


export const DroppableNewTDLItem = DropTarget("to-do item", dropTargetSpec, dropTargetCollect)(NewTDLItem);
