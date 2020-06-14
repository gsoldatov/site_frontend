import React from "react";

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
