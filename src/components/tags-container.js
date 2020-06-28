import { connect } from "react-redux";
import Tags from "./tags";
import { pageFetch } from "../actions/tags";
import { getTagsPaginationCacheKey } from "../store/state-util";
import { setTagsRedirectOnRender } from "../actions/tags";

const mapStateToProps = (state, ownProps) => {
    
    return {
        paginationInfo: state.tagsUI.paginationInfo,
        redirectOnRender: state.tagsUI.redirectOnRender,
        
        paginationFetch: state.tagsUI.paginationFetch
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
