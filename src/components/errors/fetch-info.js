import React from "react";
import { connect } from "react-redux";
import StyleFetchInfo from "../../styles/fetch-info.css";

/*
    Component for rendering fetch status and error.
*/

class FetchInfo extends React.Component {
    render() {
        if (this.props.fetchInfo.isFetching) {
            const isFetchingMessage = this.props.isFetchingMessage ? this.props.isFetchingMessage : "Fetching data...";
            return (
                <div className="is-fetching-message">{isFetchingMessage}</div>
            );
        }        

        return this.props.fetchInfo.fetchError && (
            <div className="fetch-error">{this.props.fetchInfo.fetchError}</div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        fetchInfo: ownProps.getFetchInfo(state)
    };
}

const FetchInfoContainer = connect(mapStateToProps, null)(FetchInfo);

export default FetchInfoContainer;
