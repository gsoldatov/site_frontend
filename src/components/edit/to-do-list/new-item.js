import React from "react";


export class NewTDLItem extends React.PureComponent {
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
        const input = <div className="to-do-list-item-input new" ref={this.inputRef} contentEditable suppressContentEditableWarning placeholder="New item"
                onInput={this.handleInputChange} onKeyDown={this.handleKeyDown} >{""}</div>;
        
        return (
            <div className="to-do-list-item">
                {input}
            </div>
        );
    }
}