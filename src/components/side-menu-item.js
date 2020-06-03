import React from "react";

class SideMenuItem extends React.Component {
    render() {
        const className = this.props.isActive ? "side-menu-item" : "side-menu-item-inactive";
        const onClick = this.props.isActive ? this.props.onClick : null;

        return (
            <div className={className} onClick={onClick}>
                {this.props.itemJSX}
            </div>
        );
    }
}

export default SideMenuItem;