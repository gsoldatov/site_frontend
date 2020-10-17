import React from "react";

import StyleObjectFieldInput from "../../styles/object-field-input.css";

/*
    Component which renders the form for editing object's/tag's name or description.
    <ObjectFieldInputContainer> should be used in parent components for connecting this component to the store.
*/

class ObjectFieldInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.name,
            description: this.props.description
        }

        this.description = React.createRef();
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    }

    handleNameChange(e) {
        this.setState({
            ...this.state,
            name: e.target.value
        }, 
        () => this.props.changeCallback(this.state)
        );
    }

    handleDescriptionChange(e) {
        this.setState({
            ...this.state,
            description: e.target.value
        }, 
        () => this.props.changeCallback(this.state)
        );
    }

    componentDidUpdate() {
        // Update the height of textarea to the size of its text
        if (this.description.current) {
            this.description.current.style.height = "inherit";  // reset
            this.description.current.style.height = this.description.current.scrollHeight + "px";   // set to text height
        }
    }

    render () {
        return (
            <section className="object-field-input">
                <form className="object-field-input-form">
                    <label htmlFor="object_name" className="object-field-input-form-label">
                        {this.props.nameLabel}
                    </label>
                    <input type="text" id="object_name" value={this.state.name} 
                        readOnly={false}
                        onChange={this.handleNameChange}
                        className="object-field-input-form-text-input" />
                    <label htmlFor="object_description" className="object-field-input-form-label">
                        {this.props.descriptionLabel}
                    </label>
                    <textarea id="object_description" value={this.state.description}
                        ref={this.description}
                        onChange={this.handleDescriptionChange}
                        className="object-field-input-form-text-area" />
                </form>
            </section>
        );
    }
}

export default ObjectFieldInput;
