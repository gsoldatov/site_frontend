import { connect } from "react-redux";
import TagField from "./tag-field";
import { setCurrentTag } from "../actions/tag";

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