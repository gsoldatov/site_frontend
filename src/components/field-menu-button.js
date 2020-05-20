import React from "react";

class FieldMenuButton extends React.Component {
    render() {
        const overlay = this.props.buttonState || "active";
        let overlayClassName;
        switch (overlay) {
            case "inactive":
                overlayClassName = "field-menu-button-overlay-inactive";
                break;
            case "pressed":
                overlayClassName = "field-menu-button-overlay-pressed";
                break;
            default:
                overlayClassName = "field-menu-button-overlay-active";
                break;
        }

        // TODO onClick dispatch
        const onClick = this.props.buttonState === "inactive" ? undefined : undefined;

        return (
            <div className="field-menu-item">
                <img className="field-menu-button" src={this.props.src} />
                <div className={overlayClassName} />
            </div>
                // <span className={className}>{this.props.text}</span>
        );
    }
}

export default FieldMenuButton;