import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import ObjectPage from "./object-page";
import ObjectFieldContainer from "./object-field-container";
import ObjectFieldInfo from "./object-field-info";
import ObjectFieldInputContainer from "./object-field-input-container";
import ObjectFieldSwitchContainer from "./object-field-switch-container";

import { loadAddObjectPage, editObjectOnLoadFetch, setCurrentObject } from "../../actions/object";

import getAddObjectPageSideMenuItems from "./object-add-side-menu-itemlist";
import getEditObjectPageSideMenuItems from "./object-edit-side-menu-itemlist";

/*
    /objects/add and /objects/edit components.
*/
class Object_ extends React.Component {
    render() {
        const object = this.props.object;
        // Container components are required in order to get the correct current state without re-renders 
        // after the onLoad action has been performed in the <ObjectPage> constructor.
        return (
            <ObjectPage redirectOnRender={this.props.redirectOnRender} onLoad={this.props.onLoad} sideMenuItems={this.props.sideMenuItems}>
                <ObjectFieldContainer getRedirectOnRender={state => state.objectUI.redirectOnRender} getOnLoadFetch={this.props.getOnLoadFetch}>
                    <ObjectFieldInfo getFetchInfo={this.props.getFetchInfo} headerText={this.props.headerText}
                        createdAt={object.created_at} modifiedAt={object.modified_at} typeSelector={this.props.typeSelector} />
                    
                    <ObjectFieldInputContainer nameLabel="Object name" getName={state => state.objectUI.currentObject.object_name}
                        descriptionLabel="Object description" getDescription={state => state.objectUI.currentObject.object_description} 
                        changeCallback={this.props.changeCallback} />
                    
                    <ObjectFieldSwitchContainer />
                </ObjectFieldContainer>
            </ObjectPage>
        );        
    }
}

/* Add object page */
const addObjectMapStateToProps = state => {
    return {
        redirectOnRender: state.objectUI.redirectOnRender,
        sideMenuItems: getAddObjectPageSideMenuItems(),
        getFetchInfo: state => state.objectUI.objectOnSaveFetch,
        headerText: "Add a New Object",
        object: state.objectUI.currentObject,
        typeSelector: "editable"    //"editable" or "frozen"
    };
};

const addObjectMapDispatchToProps = dispatch => {
    return {
        onLoad: () => dispatch(loadAddObjectPage()),
        changeCallback: componentState => dispatch(setCurrentObject({ object_name: componentState.name, object_description: componentState.description }))
    };
};

export const AddObject = connect(addObjectMapStateToProps, addObjectMapDispatchToProps)(Object_);

/* Edit object page */
const editObjectMapStateToProps = state => {
    return {
        redirectOnRender: state.objectUI.redirectOnRender,
        sideMenuItems: getEditObjectPageSideMenuItems(),
        getOnLoadFetch: state => state.objectUI.objectOnLoadFetch,
        getFetchInfo: state => state.objectUI.objectOnSaveFetch,
        headerText: "Object Information",
        object: state.objectUI.currentObject,
        typeSelector: "frozen"    //"editable" or "frozen"
    };
};

const editObjectMapDispatchToProps = (dispatch, ownProps) => {
    return {
        onLoad: () => dispatch(editObjectOnLoadFetch(ownProps.match.params.id)),
        changeCallback: componentState => dispatch(setCurrentObject({ object_name: componentState.name, object_description: componentState.description }))
    };
};

export const EditObject = withRouter(connect(editObjectMapStateToProps, editObjectMapDispatchToProps)(Object_));
