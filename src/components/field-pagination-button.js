import React from "react";

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