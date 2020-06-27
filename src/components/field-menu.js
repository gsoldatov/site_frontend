import React from "react";

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
