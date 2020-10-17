import { connect } from "react-redux";
import ObjectField from "./object-field";

/*
    ObjectField wrapper for connecting to the store.

    Props:
    * getRedirectOnRender - function which returns the path to redirect to from the current state;
    * getOnLoadFetch - function which returns the on load fetch status from the current state.
*/

const mapStateToProps = (state, ownProps) => {
    const getRedirectOnRender = ownProps.getRedirectOnRender;
    const getOnLoadFetch = ownProps.getOnLoadFetch;

    return {
        redirectOnRender: getRedirectOnRender === undefined ? undefined : getRedirectOnRender(state),
        onLoadFetch: getOnLoadFetch === undefined ? undefined : getOnLoadFetch(state)
    };
};

const ObjectFieldContainer = connect(mapStateToProps, null)(ObjectField);

export default ObjectFieldContainer;
