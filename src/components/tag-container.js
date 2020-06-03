import { connect } from "react-redux";
import { withRouter } from "react-router";
import Tag from "./tag";
import { loadAddTagPage, loadEditTagPage, setRedirectOnRender, editTagOnLoadFetch } from "../actions/tag";

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        loadAddTagPage: () => { dispatch(loadAddTagPage()); },
        loadEditTagPage: () => { dispatch(loadEditTagPage()); },
        setRedirectOnRender: (redirectOnRender) => { dispatch(setRedirectOnRender(redirectOnRender)) },
        editTagOnLoadFetch: (tag_id) => { dispatch(editTagOnLoadFetch(tag_id)); }
    };
};

const TagContainer = withRouter(connect(null, mapDispatchToProps)(Tag));

export default TagContainer;