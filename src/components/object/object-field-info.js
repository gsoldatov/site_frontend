import React from "react";

const timestamp = (text, timestamp) => {
    return (
        timestamp && (
            <div className="item-field-date">
                <span className="item-field-date-label">{text}</span>
                <span className="item-field-date-value">{timestamp}</span>
            </div>
        )
    );
};

class ObjectFieldInfo extends React.Component {
    render() {
        const fetchError = this.props.onSaveFetch.fetchError && (
            <div className="fetch-error-info">{this.props.onSaveFetch.fetchError}</div>
        );

        const timestamps = this.props.createdAt && (
            <div className="item-field-timestamps">
                {timestamp("Created at: ", this.props.createdAt)}
                {timestamp("Modified at: ", this.props.modifiedAt)}
            </div>
        );

        return (
            <section className="tag-page-body">
                <h3 className="item-field-header">{this.props.headerText}</h3>
                {fetchError}
                {this.props.objectTypeSwitch}
                {timestamps}
            </section>
        );
    }
}

export default ObjectFieldInfo;
