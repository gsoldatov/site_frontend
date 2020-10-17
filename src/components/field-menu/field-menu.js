import React from "react";

import StyleFieldMenu from "../../styles/field-menu.css";

/*
    Component for rendering a field menu with a list items passed to it as props.
*/
class FieldMenu extends React.Component {
    render() {
        return (
            <section className="field-menu">
                <div className="field-menu-div">
                    {this.props.items}
                </div>
            </section>
        );
    }
}

export default FieldMenu;
