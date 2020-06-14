import React from "react";

class SideMenuDialogButton extends React.Component {
    render() {
        const CSSClass = this.props.CSSClass ? this.props.CSSClass : "side-menu-dialog-button";
        return (
            <button className={CSSClass} onClick={this.props.onClick}>{this.props.text}</button>
        );
    }
}

export default SideMenuDialogButton;
