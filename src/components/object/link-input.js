import React from "react";

import StyleObjectFieldInput from "../../styles/object-field-input.css";

/*
    Component which renders link edit form.
    <LinkInputContainer> should be used in parent components for connecting this component to the store.
*/

class LinkInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            link: this.props.link
        }

        this.handleLinkChange = this.handleLinkChange.bind(this);
    }


    handleLinkChange(e) {
        this.setState({
            ...this.state,
            link: e.target.value
        }, 
        () => this.props.changeCallback(this.state)
        );
    }

    render () {
        return (
            <section className="object-field-input">
                <form className="object-field-input-form">
                    <label htmlFor="link" className="object-field-input-form-label">
                        Link
                    </label>
                    <input type="text" id="link" value={this.state.link} 
                        readOnly={false}
                        onChange={this.handleLinkChange}
                        className="object-field-input-form-text-input" />
                </form>
            </section>
        );
    }
}

export default LinkInput;
