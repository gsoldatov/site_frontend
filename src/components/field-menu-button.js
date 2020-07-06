import React from "react";

class FieldMenuButton extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        if (this.props.buttonState !== "inactive") {
            if (this.props.onClickParams) {
                this.props.onClick(this.props.onClickParams);
            } else {
                this.props.onClick();
            }
            
        }
    }

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

        return (
            <div className="field-menu-item">
                <img className="field-menu-button" src={this.props.src} />
                <div className={overlayClassName} title={this.props.title} onClick={this.handleClick} />
            </div>
        );
    }
}

export default FieldMenuButton;