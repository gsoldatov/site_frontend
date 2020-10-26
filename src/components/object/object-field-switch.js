import React from "react";

import LinkInputContainer from "./link-input-container";

/*
    Component which renders the appropriate component(s) on the object page based on the object's type.
    <ObjectFieldSwitchContainer> should be used in parent components for connecting this component to the store.
*/
class ObjectFieldSwitch extends React.Component {
    render() {
        switch (this.props.type) {
            case "link":
                return (
                    <LinkInputContainer />
                );
            default:
                return null;
        }
    }
}

export default ObjectFieldSwitch;