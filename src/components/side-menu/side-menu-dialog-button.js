import React from "react";

/*
    Component which renders a button for a SideMenuDialog component.
    SideMenuDialogButtonContainer should be used instead of this class to connect it to the state.
*/
class SideMenuDialogButton extends React.Component {
    render() {
        const CSSClass = this.props.CSSClass ? this.props.CSSClass : "side-menu-dialog-button";
        return (
            <button className={CSSClass} onClick={this.props.onClick}>{this.props.text}</button>
        );
    }
}

export default SideMenuDialogButton;
