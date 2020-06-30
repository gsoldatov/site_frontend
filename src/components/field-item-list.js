import React from "react";

class FieldItemList extends React.Component {
    render() {
        if (this.props.isFetching) {
            return (<div>Loading...</div>);
        }

        if (this.props.fetchError) {
            return (<div>{this.props.fetchError}</div>);
        }

        return (
            <div className="field-item-list">
                {this.props.items}
            </div>
        );
    }
}

export default FieldItemList;