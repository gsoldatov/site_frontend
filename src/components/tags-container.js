import { connect } from "react-redux";
import Tags from "./tags";
import { pageFetch } from "../actions/tags";
import { isFetchingTags } from "../store/state-check-functions";
import { getTagsFetchError } from "../store/state-util";
import { setTagsRedirectOnRender } from "../actions/tags";

const mapStateToProps = (state, ownProps) => {
    return {
        paginationInfo: state.tagsUI.paginationInfo,
        selectedTagIDs: state.tagsUI.selectedTagIDs,
        redirectOnRender: state.tagsUI.redirectOnRender,
        isFetching: isFetchingTags(state),
        fetchError: getTagsFetchError(state)
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        setCurrentPage: page => dispatch(pageFetch(page)),
        setTagsRedirectOnRender: (redirectOnRender) => { dispatch(setTagsRedirectOnRender(redirectOnRender)) },
    };
};

const TagsContainer = connect(mapStateToProps, mapDispatchToProps)(Tags);

export default TagsContainer;
