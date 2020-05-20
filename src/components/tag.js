import React from "react";
import Navigation from "./navigation";
import SideMenu from "./side-menu";
import TagField from "./tag-field";

const created_at = new Date(2019, 11, 25, 17, 50, 15);
const modified_at = new Date(2020, 4, 18, 12, 28, 20);

const tempTag = {
    tag_name: "Music",
    tag_description: "Everything related to music",
    created_at: created_at.toLocaleString("ru-RU"),
    modified_at: modified_at.toLocaleString("ru-RU")
};

class Tag extends React.Component {
    render() {
        return (
            <div className="layout-div">
                <Navigation />
                <SideMenu />
                <TagField tag={tempTag} />
            </div>
        );
    }
}

export default Tag;