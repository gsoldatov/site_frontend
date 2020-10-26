import React from "react";
import StyleTypeSelector from "../../styles/type-selector.css";

/*
    Component which renders object's type switch on the /objects/add and /objects/edit pages.
    <ObjectTypeSelectorContainer> should be used in parent components for connecting this component to the store.
*/

class ObjectTypeSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            type: this.props.type
        };

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        this.setState({
            ...this.state,
            type: e.target.value
        }, 
        () => this.props.changeCallback(this.state)
        );
    }

    render() {
        const types = [
            { value: "link", text: "Link" }, 
            { value: "markdown", text: "Markdown" },
            { value: "todo", text: "To-Do List" }
        ];
        let k = 0;

        return (
            <form className="object-type-selector-form">
                <label className="object-type-selector-label" htmlFor="object-type-selector">
                    Object type
                </label>
                <select id="object-type-selector" className="object-type-selector-select" value={this.state.type} onChange={this.handleChange} disabled={this.props.disabled}>
                    { types.map(type => <option className="object-type-selector-option" value={type.value} key={k++}>{type.text}</option>) }
                </select>
            </form>
        );
    }
}

export default ObjectTypeSelector;