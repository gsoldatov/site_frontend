import React from "react";

class FieldItemList extends React.Component {
    render() {
        const paginationFetch = this.props.paginationFetch;
        if (paginationFetch.isFetching) {
            return (<div>Loading...</div>);
        }

        if (paginationFetch.fetchError) {
            return (<div>{paginationFetch.fetchError}</div>);
        }

        return (
            <div className="field-item-list">
                {this.props.items}
            </div>
        );
    }
}

export default FieldItemList;