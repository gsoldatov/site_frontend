import React from "react";
import { connect } from "react-redux";

import ObjectPage from "../object/object-page";
import ObjectFieldContainer from "../object/object-field-container";
import FieldMenu from "../field-menu/field-menu";
import FetchInfoContainer from "../errors/fetch-info";
import FieldItemListContainer from "../field-item/field-item-list-container";
import FieldPaginationContainer from "../field-pagination/field-pagination-container";

import { pageFetch, setObjectsRedirectOnRender } from "../../actions/objects";
import getObjectsPageSideMenuItems from "./objects-side-menu-item-list";
import getObjectsFieldMenuItems from "./objects-field-menu-items";
import objectsFieldItemFactory from "./objects-field-item-factory";

class Objects extends React.Component {
    render() {
        const onLoad = () => {
            this.props.setObjectsRedirectOnRender("");
            this.props.setCurrentPage(this.props.currentPage);
        };

        const fieldItemListsAndPagination = !this.props.fetchInfo.isFetching && !this.props.fetchInfo.fetchError && (
            <>
                <FieldItemListContainer itemIDs={this.props.selectedObjectIDs} itemFactory={objectsFieldItemFactory} isExpandable={true} />
                <FieldItemListContainer itemIDs={this.props.paginationInfo.currentPageObjectIDs} itemFactory={objectsFieldItemFactory} />
                <FieldPaginationContainer paginationInfo={this.props.paginationInfo} setCurrentPage={this.props.setCurrentPage} />
            </>
        );

        return (
            <ObjectPage onLoad={onLoad} sideMenuItems={getObjectsPageSideMenuItems(this.props.selectedObjectIDs[0])}>
                <ObjectFieldContainer getRedirectOnRender={state => state.objectsUI.redirectOnRender}>
                    <FieldMenu items={getObjectsFieldMenuItems()} /> 
                    <FetchInfoContainer getFetchInfo={state => state.objectsUI.fetch} />
                    {fieldItemListsAndPagination}
                </ObjectFieldContainer>
            </ObjectPage>
        ); 
    }
}

const mapStateToProps = state => {
    return {
        currentPage: state.objectsUI.paginationInfo.currentPage,
        fetchInfo: state.objectsUI.fetch,
        selectedObjectIDs: state.objectsUI.selectedObjectIDs,
        paginationInfo: state.objectsUI.paginationInfo
    };
};

const mapDispatchToProps = dispatch => {
    return {
        setObjectsRedirectOnRender: route => dispatch(setObjectsRedirectOnRender(route)),
        setCurrentPage: page => dispatch(pageFetch(page))
    };
};

const ObjectsContainer = connect(mapStateToProps, mapDispatchToProps)(Objects);

export default ObjectsContainer;
