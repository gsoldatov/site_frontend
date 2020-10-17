import React from "react";

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
            <form className="item-field-form">
                <label htmlFor="tag_name" className="item-field-form-label">
                    {this.props.nameLabel}
                </label>
                <input type="text" id="tag_name" value={this.state.name} 
                    readOnly={false}
                    onChange={this.handleNameChange}
                    className="item-field-form-text-input" />
                <label htmlFor="tag_description" className="item-field-form-label">
                    {this.props.descriptionLabel}
                </label>
                <textarea id="tag_description" value={this.state.description}
                    ref={this.description}
                    onChange={this.handleDescriptionChange}
                    className="item-field-form-text-area" />
            </form>
        );
    }
}

export default ObjectFieldInput;
