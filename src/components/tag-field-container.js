import { connect } from "react-redux";
import TagField from "./tag-field";
import { setCurrentTag } from "../actions/tag";

const mapStateToProps = (state, ownProps) => {
    return {
        isAddTagPage: ownProps.isAddTagPage,
        isFetching: ownProps.isAddTagPage
                    ? undefined
                    : state.tagUI.editTagFetch.isFetching,
        fetchError: ownProps.isAddTagPage
                    ? state.tagUI.addTagFetch.fetchError
                    : state.tagUI.editTagFetch.fetchError,
        redirectOnRender: state.tagUI.redirectOnRender,
        tag: state.tagUI.currentTag
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        setCurrentTag: (tag) => { dispatch(setCurrentTag(tag)); }
    };
};

const TagFieldContainer = connect(mapStateToProps, mapDispatchToProps)(TagField);

export default TagFieldContainer;