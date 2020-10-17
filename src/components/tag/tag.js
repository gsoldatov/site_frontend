import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import ObjectPage from "../object/object-page";
import ObjectFieldContainer from "../object/object-field-container";
import ObjectFieldInfo from "../object/object-field-info";
import ObjectFieldInputContainer from "../object/object-field-input-container";

import { loadAddTagPage, editTagOnLoadFetch, setCurrentTag } from "../../actions/tag";

import getAddTagPageSideMenuItems from "./tag-add-side-menu-itemlist";
import getEditTagPageSideMenuItems from "./tag-edit-side-menu-itemlist";

class Tag extends React.Component {
    render() {
        const tag = this.props.tag;
        // Container components are required in order to get the correct current state without re-renders 
        // after the onLoad action has been performed in the <ObjectPage> constructor.
        return (
            <ObjectPage redirectOnRender={this.props.redirectOnRender} onLoad={this.props.onLoad} sideMenuItems={this.props.sideMenuItems}>
                <ObjectFieldContainer getRedirectOnRender={state => state.tagUI.redirectOnRender} getOnLoadFetch={state => state.tagUI.tagOnLoadFetch}>
                    <ObjectFieldInfo onSaveFetch={this.props.onSaveFetch} headerText={this.props.headerText}
                        createdAt={tag.created_at} modifiedAt={tag.modified_at} />
                    
                    <ObjectFieldInputContainer nameLabel="Tag name" getName={state => state.tagUI.currentTag.tag_name}
                        descriptionLabel="Tag description" getDescription={state => state.tagUI.currentTag.tag_description} 
                        changeCallback={this.props.changeCallback} />
                </ObjectFieldContainer>
            </ObjectPage>
        );        
    }
}

/* Add tag page */
const addTagMapStateToProps = state => {
    return {
        redirectOnRender: state.tagUI.redirectOnRender,
        sideMenuItems: getAddTagPageSideMenuItems(),
        onLoadFetch: state.tagUI.tagOnLoadFetch,
        onSaveFetch: state.tagUI.tagOnSaveFetch,
        headerText: "Add a New Tag",
        tag: state.tagUI.currentTag
    };
};

const addTagMapDispatchToProps = dispatch => {
    return {
        onLoad: () => dispatch(loadAddTagPage()),
        changeCallback: componentState => dispatch(setCurrentTag({ tag_name: componentState.name, tag_description: componentState.description }))
    };
};

export const AddTag = connect(addTagMapStateToProps, addTagMapDispatchToProps)(Tag);

/* Edit tag page */
const editTagMapStateToProps = state => {
    return {
        redirectOnRender: state.tagUI.redirectOnRender,
        sideMenuItems: getEditTagPageSideMenuItems(),
        onLoadFetch: state.tagUI.tagOnLoadFetch,
        onSaveFetch: state.tagUI.tagOnSaveFetch,
        headerText: "Tag Information",
        tag: state.tagUI.currentTag
    }
}

const editTagMapDispatchToProps = (dispatch, ownProps) => {
    // const tag_id = ownProps.match.params.id;
    return {
        onLoad: () => dispatch(editTagOnLoadFetch(ownProps.match.params.id)),
        changeCallback: componentState => dispatch(setCurrentTag({ tag_name: componentState.name, tag_description: componentState.description }))
    };
};

export const EditTag = withRouter(connect(editTagMapStateToProps, editTagMapDispatchToProps)(Tag));


/*
    TODO: edit tag page => replace changed files with "2" versions => move object CSS into separate files
    tag2:
    - app;
    - components/tag/tag2;
    - actions/tag2
    - reducers/tag2
    - store/state-check-functions => isFetchingTag;
*/