import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

import ObjectPage from "../object/object-page";
import ObjectFieldContainer from "../object/object-field-container";
import FieldMenu from "../field-menu/field-menu";
import FetchInfoContainer from "../errors/fetch-info";
import FieldItemListContainer from "../field-item/field-item-list-container";
import FieldPaginationContainer from "../field-pagination/field-pagination-container";

import { pageFetch, setTagsRedirectOnRender } from "../../actions/tags";
import getTagsPageSideMenuItems from "./tags-side-menu-item-list";
import getTagsFieldMenuItems from "./tags-field-menu-items";
import tagsFieldItemFactory from "./tags-field-item-factory";

class Tags extends React.Component {
    render() {
        const onLoad = () => {
            this.props.setTagsRedirectOnRender("");
            this.props.setCurrentPage(this.props.currentPage);
        };

        const fieldItemListsAndPagination = !this.props.fetchInfo.isFetching && !this.props.fetchInfo.fetchError && (
            <>
                <FieldItemListContainer itemIDs={this.props.selectedTagIDs} itemFactory={tagsFieldItemFactory} isExpandable={true} />
                <FieldItemListContainer itemIDs={this.props.paginationInfo.currentPageTagIDs} itemFactory={tagsFieldItemFactory} />
                <FieldPaginationContainer paginationInfo={this.props.paginationInfo} setCurrentPage={this.props.setCurrentPage} />
            </>
        );

        return (
            <ObjectPage onLoad={onLoad} sideMenuItems={getTagsPageSideMenuItems(this.props.selectedTagIDs[0])}>
                <ObjectFieldContainer getRedirectOnRender={state => state.tagsUI.redirectOnRender}>
                    <FieldMenu items={getTagsFieldMenuItems()} /> 
                    <FetchInfoContainer getFetchInfo={state => state.tagsUI.fetch} />
                    {fieldItemListsAndPagination}
                </ObjectFieldContainer>
            </ObjectPage>
        ); 
    }
}

const mapStateToProps = state => {
    return {
        currentPage: state.tagsUI.paginationInfo.currentPage,
        fetchInfo: state.tagsUI.fetch,
        selectedTagIDs: state.tagsUI.selectedTagIDs,
        paginationInfo: state.tagsUI.paginationInfo
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setTagsRedirectOnRender: route => dispatch(setTagsRedirectOnRender(route)),
        setCurrentPage: page => dispatch(pageFetch(page))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Tags);
