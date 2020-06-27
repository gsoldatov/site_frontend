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
        

        let key = 0;
        this.items = [
            <FieldMenu key={key++} items={getTagsFieldMenuItems()} />,
            // <FieldItemListContainer key={key++} items={this.props.selectedTagIDs} />,     // TODO selected item field
            <FieldItemListContainer key={key++} getItemIDs={state => state.tagsUI.paginationInfo.currentPageTagIDs} getPaginationFetch={state => state.tagsUI.paginationFetch}
                itemFactory={tagsFieldItemFactory} />,
            <FieldPaginationContainer key={key++} getPaginationInfo={state => state.tagsUI.paginationInfo} setCurrentPage={this.props.setCurrentPage} />

            // items: ownProps.itemFactory(state, ownProps.itemIDs),
            // paginationFetch: ownProps.paginationFetch,
            // collapseHeight:
        ];
    }

    render() {
        if (this.props.redirectOnRender) {
            this.props.setTagsRedirectOnRender("");
            return <Redirect to={this.props.redirectOnRender} />;
        }
        return (
            <div className="layout-div">
                <Navigation />
                <SideMenu items={getTagsPageSideMenuItems()} />
                <Main items={this.items} />
            </div>
        );
    }
}

export default Tags;