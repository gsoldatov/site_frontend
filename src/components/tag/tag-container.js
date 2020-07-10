import { connect } from "react-redux";
import { withRouter } from "react-router";
import Tag from "./tag";
import { loadAddTagPage, loadEditTagPage, setTagRedirectOnRender, editTagOnLoadFetch } from "../../actions/tag";

/*
    Tag wrapper for connecting to the store.

    Props:
    * loadAddTagPage - action creator for setting state on add tag page load;
    * loadEditTagPage - action creator for setting state on edit tag page load or after redirect from add tag page;
    * setTagRedirectOnRender - action creating for setting redirect on next render of the component;
    * editTagOnLoadFetch - thunk creator for fetching edited tag data on edit tag page load or after redirect from add tag page.
*/
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        loadAddTagPage: () => { dispatch(loadAddTagPage()); },
        loadEditTagPage: () => { dispatch(loadEditTagPage()); },
        setRedirectOnRender: (redirectOnRender) => { dispatch(setTagRedirectOnRender(redirectOnRender)) },
        editTagOnLoadFetch: (tag_id) => { dispatch(editTagOnLoadFetch(tag_id)); }
    };
};

const TagContainer = withRouter(connect(null, mapDispatchToProps)(Tag));

export default TagContainer;