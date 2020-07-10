import React from "react";

/*
    Component which renders a button displayed in the pagination block.
*/
class FieldPaginationButton extends React.Component {
    render() {
        const className = this.props.className || "field-pagination-button";
        return (
            <button className={className} onClick={this.props.onClick}>
                {this.props.text}
            </button>
        );
    }
}

export default FieldPaginationButton;