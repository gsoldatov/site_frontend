import { connect } from "react-redux";
import TagField from "./tag-field";
import { setCurrentTag } from "../../actions/tag";

/*
    Tag wrapper for connecting to the store.

    Props:
    * currentTag - object for holding the state of the tag displayed on the page;
    * redirectOnRender - URL to redirect to on next TagField render;
    * isAddTagPage - boolean which indicates if add or edit tag page will be rendered;
    * lastFetch - string which holds the type of the last performed fetch;
    * addTagOnSaveFetch, editTagOnLoadFetch, editTagOnSaveFetch, editTagOnDeleteFetch - objects which hold the state of respective fetches;
    * setCurrentTag - action dispatcher for updating the state of the current tag.
*/
const mapStateToProps = (state, ownProps) => {
    return {
        tag: state.tagUI.currentTag,
        redirectOnRender: state.tagUI.redirectOnRender,
        isAddTagPage: ownProps.isAddTagPage,

        lastFetch: state.tagUI.lastFetch,
        addTagOnSaveFetch: state.tagUI.addTagOnSaveFetch,
        editTagOnLoadFetch: state.tagUI.editTagOnLoadFetch,
        editTagOnSaveFetch: state.tagUI.editTagOnSaveFetch,
        editTagOnDeleteFetch: state.tagUI.editTagOnDeleteFetch
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        setCurrentTag: (tag) => { dispatch(setCurrentTag(tag)); }
    };
};

const TagFieldContainer = connect(mapStateToProps, mapDispatchToProps)(TagField);

export default TagFieldContainer;