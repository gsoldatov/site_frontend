import React from "react";

class FieldMenuFilter extends React.Component {
    render() {
        const placeholder = this.props.placeholder || "Filter...";
        return (
            <div className="field-menu-item">
                <input type="search" className="field-menu-filter" 
                    placeholder = {placeholder} onChange={this.props.onChange} />
            </div>
            
        );
    }
}

export default FieldMenuFilter;
