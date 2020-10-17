import React from "react";

import StyleObjectFieldInfo from "../../styles/object-field-info.css";

/*
    Component for displaying header, onSave fetch errors, timestamps and object type switches on the object/tag pages.
*/
const timestamp = (text, timestamp) => {
    return (
        timestamp && (
            <div className="object-field-date">
                <span className="object-field-date-label">{text}</span>
                <span className="object-field-date-value">{timestamp}</span>
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
            <div className="object-field-timestamps">
                {timestamp("Created at: ", this.props.createdAt)}
                {timestamp("Modified at: ", this.props.modifiedAt)}
            </div>
        );

        return (
            <section className="object-field-info">
                <h3 className="object-field-header">{this.props.headerText}</h3>
                {fetchError}
                {this.props.objectTypeSwitch}
                {timestamps}
            </section>
        );
    }
}

export default ObjectFieldInfo;
