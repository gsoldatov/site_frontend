import React from "react";
import { connect } from "react-redux";
import StyleFetchError from "../../styles/fetch-error.css";

class FetchError extends React.Component {
    render() {
        return this.props.fetchInfo.fetchError && (
            <div className="fetch-error-info">{this.props.fetchInfo.fetchError}</div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        fetchInfo: ownProps.getFetchInfo(state)
    };
}

const FetchErrorContainer = connect(mapStateToProps, null)(FetchError);

export default FetchErrorContainer;
