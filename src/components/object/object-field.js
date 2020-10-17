import React from "react";
import { Redirect } from "react-router-dom";

/*
    Component which renders the main part of the object/tag page.
*/

class ObjectField extends React.Component {
    render() {
        if (this.props.redirectOnRender) {
            return <Redirect to={this.props.redirectOnRender} />;          
        }
        
        let onLoadFetch = this.props.onLoadFetch;
        let isFetching = typeof(onLoadFetch) === "object" ? onLoadFetch.isFetching : null;
        let fetchError = typeof(onLoadFetch) === "object" ? onLoadFetch.fetchError : null;

        if (isFetching) {
            return <div>Fetching data...</div>
        }

        if (fetchError) {
            return <div>Failed to fetch data: {this.props.onLoadFetch.fetchError}</div>
        }

        return (
            <main>
                {this.props.children}
            </main>
        );
    }
}

export default ObjectField;
