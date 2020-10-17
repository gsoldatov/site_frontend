import React from "react";
import Navigation from "../navigation";
import SideMenu from "../side-menu/side-menu";


/*
    A template component for object/tag pages.
*/

class ObjectPage extends React.Component {
    constructor(props) {
        super(props);
        this.props.onLoad();
    }

    render() {
        return (
            <div className="layout-div">
                <Navigation />
                <SideMenu items={this.props.sideMenuItems}/>
                {this.props.children}
            </div>
        );
    }
}

export default ObjectPage;
