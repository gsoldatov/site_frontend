import { connect } from "react-redux";
import Tags from "./tags";
import { pageFetch, setTagsRedirectOnRender } from "../../actions/tags";
import { isFetchingTags } from "../../store/state-check-functions";
import { getTagsFetchError } from "../../store/state-util";

/*
    Tags wrapper for connecting to the store.

    Props:
    * paginationInfo - object, which store information about paginaiton block displayed on the page;
    * selectedTagIDs - list of currently selected tag IDs;
    * redirectOnRender - URL to redirect to on next render;
    * isFetching - boolean which indicates that a fetch is currently being performed on the page;
    * fetchError - error message of the last fetch performed;
    * pageFetch - thunk creator for fetching data of the current page;
    * setTagsRedirectOnRender - action creator for setting the URL to redirect to on next render.
*/
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
