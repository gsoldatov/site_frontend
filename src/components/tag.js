import React from "react";
import Navigation from "./navigation";
import TagFieldContainer from "./tag-field-container";
import SideMenu from "./side-menu";
import getAddTagPageSideMenuItems from "./side-menu-itemlist-add-tag";
import getEditTagPageSideMenuItems from "./side-menu-itemlist-edit-tag";

class Tag extends React.Component {
    constructor(props) {
        super(props);

        this.props.setRedirectOnRender("");
        let currentID = this.props.match.params.id;

        if (currentID === "add") {
            this.props.loadAddTagPage();
        } else {
            this.props.loadEditTagPage();
            this.props.editTagOnLoadFetch(currentID);
            // TODO fetch linked tag data here
        }

        // side menu items
        this.addTagSideMenuItems = getAddTagPageSideMenuItems();
        this.editTagSideMenuItems = getEditTagPageSideMenuItems();
    }

    componentDidUpdate(prevProps) {
        // Handle redirect to tag page after successful tag creation
        let currentID = this.props.match.params.id;
        let previousID = prevProps.match.params.id;

        if (currentID !== "add" && previousID === "add") {
            this.props.setRedirectOnRender("");
            this.props.loadEditTagPage();
            this.props.editTagOnLoadFetch(currentID);
            // TODO fetch linked tag data here
        }
    }

    render() {
        const isAddTagPage = this.props.match.params.id === "add";
        const sideMenuItems = isAddTagPage ? this.addTagSideMenuItems : this.editTagSideMenuItems;
        return (
            <div className="layout-div">
                <Navigation />
                <SideMenu items={sideMenuItems}/>
                <TagFieldContainer isAddTagPage={isAddTagPage} />
            </div>
        );
    }
}

export default Tag;