import React from "react";

class FieldMenuFilter extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {text: ""};
    }

    handleChange(e) {
        const newText = e.target.value;
        const onChangeParams = this.props.getOnChangeParams(newText);
        this.setState({ text: newText },
            () => this.props.onChange(onChangeParams)
        );
    }

    render() {
        const placeholder = this.props.placeholder || "Filter...";
        return (
            <div className="field-menu-item">
                <input type="search" className="field-menu-filter" 
                    placeholder = {placeholder} onChange={this.handleChange} />
            </div>
            
        );
    }
}

export default FieldMenuFilter;
