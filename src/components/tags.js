import React from "react";
import { Redirect } from "react-router-dom";
import Navigation from "./navigation";
import SideMenu from "./side-menu";
import Main from "./main";

import getTagsPageSideMenuItems from "./tags-side-menu-item-list";
import getTagsFieldMenuItems from "./tags-field-menu-items";
import FieldMenu from "./field-menu";
import FieldItemListContainer from "./field-item-list-container";
import tagsFieldItemFactory from "./tags-field-item-factory";
import FieldPaginationContainer from "./field-pagination-container";

class Tags extends React.Component {
    constructor(props) {
        super(props);
        this.props.setCurrentPage(this.props.paginationInfo.currentPage);
    }

    componentDidUpdate() {
        // Clear redirectOnRender after rendering Redirect component
        if (this.props.redirectOnRender) {
            this.props.setTagsRedirectOnRender("");
        }
    }

    render() {
        if (this.props.redirectOnRender) {
            return <Redirect to={this.props.redirectOnRender} />;
        }

        let key = 0;
        this.items = [
            <FieldMenu key={key++} items={getTagsFieldMenuItems()} />,
            <FieldItemListContainer key={key++} itemIDs={this.props.selectedTagIDs} itemFactory={tagsFieldItemFactory} isExpandable={true} />,
            <FieldItemListContainer key={key++} itemIDs={this.props.paginationInfo.currentPageTagIDs} isFetching={this.props.isFetching} fetchError={this.props.fetchError}
                itemFactory={tagsFieldItemFactory} />,
            <FieldPaginationContainer key={key++} paginationInfo={this.props.paginationInfo} setCurrentPage={this.props.setCurrentPage} />
        ];

        return (
            <div className="layout-div">
                <Navigation />
                <SideMenu items={getTagsPageSideMenuItems(this.props.selectedTagIDs[0])} />
                <Main items={this.items} />
            </div>
        );
    }
}

export default Tags;