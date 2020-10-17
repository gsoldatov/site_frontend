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
        // this.state = { firstRender: true }; // Workaround for avoiding redirects on first render (this.props.onLoad sets "redirectOnRender" state property to "", but the props are not updated accordingly)
    }

    render() {
        // console.log("IN ObjectPage RENDER, redirectOnRender = " + this.props.redirectOnRender)
        // if (this.props.redirectOnRender) {
        //     if (this.state.firstRender) {
        //         this.setState({...this.state, firstRender: false });
        //         return null;
        //     } else {
        //         return <Redirect to={this.props.redirectOnRender} />;
        //     }            
        // }

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
