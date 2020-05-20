import React from "react";
import Navigation from "./navigation";
import SideMenu from "./side-menu";
import TagsField from "./tags-field";

class Tags extends React.Component {
    render() {
        return (
            <div className="layout-div">
                <Navigation />
                <SideMenu />
                <TagsField />
            </div>
        );
    }
}

export default Tags;