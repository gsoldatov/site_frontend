import React from "react";

/*
    Component which renders a dialog with provided via message and buttons in the side menu. 
    SideMenuDialogContainer should be used instead of this class to connect it to the state.
*/
class SideMenuDialog extends React.Component {
    render() {
        if (!this.props.isVisible) {
            return null;
        }
        
        return (
            <div className="side-menu-dialog">
                <div className="side-menu-dialog-message">{this.props.message}</div>
                <div className="side-menu-dialog-buttons">{this.props.buttons}</div>
            </div>
        );
    }
}

export default SideMenuDialog;
