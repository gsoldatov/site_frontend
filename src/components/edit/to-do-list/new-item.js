import React from "react";
import { DropTarget } from "react-dnd";


class NewTDLItem extends React.PureComponent {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    handleInputChange = e => {
        this.props.updateCallback({ toDoListItemUpdate: { command: "add", position: this.props.position, item_text: e.currentTarget.textContent }})
        e.currentTarget.textContent = "";
    };

    handleKeyDown = e => {
        if (e.keyCode == 10 || e.keyCode == 13) e.preventDefault();     // disable adding new lines
        else if (e.key === "ArrowUp") {
            this.props.updateCallback({ toDoListItemUpdate: { command: "focusPrev", focusLastItem: true }});
        }
    };
    
    render() {
        const { connectDropTarget, isHovered } = this.props;

        // Additional element when hovered
        const onHoverSpace = isHovered && (
            <div className="to-do-list-item-on-hover-space" />
        )
        
        // Input
        const input = <div className="to-do-list-item-input new" ref={this.inputRef} contentEditable suppressContentEditableWarning placeholder="New item"
                onInput={this.handleInputChange} onKeyDown={this.handleKeyDown} >{""}</div>;
        
        return connectDropTarget(
            <div className="to-do-list-item-container">
                {onHoverSpace}
                <div className="to-do-list-item">
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
