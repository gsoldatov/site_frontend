import React from "react";
import intervalWrapper from "../util/interval-wrapper";

class FieldMenuFilter extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {text: this.props.text};
        this.onChangeRunner = intervalWrapper(this.props.onChange, 500, true);      // wrap onChange action dispatch to limit its execution frequency
    }

    handleChange(e) {
        const newText = e.target.value;
        const onChangeParams = this.props.getOnChangeParams(newText);
        this.setState({ text: newText }, this.onChangeRunner(onChangeParams));
    }

    render() {
        const placeholder = this.props.placeholder || "Filter...";
        return (
            <div className="field-menu-item">
                <input type="search" className="field-menu-filter" value={this.state.text}
                    placeholder = {placeholder} onChange={this.handleChange} />
            </div>
            
        );
    }
}

export default FieldMenuFilter;
