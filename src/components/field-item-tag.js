import React from "react";
import { Link } from "react-router-dom";

class FieldItem extends React.Component {
    render() {
        return (
            <div className="field-item">
                <input type="checkbox" checked={this.props.checked} 
                    onChange = {() => {}}
                    className="field-item-tag-checkbox" />
                <Link to={this.props.link} className="field-item-tag-link">{
                    this.props.text}
                </Link>
            </div>
        );
    }
}

export default FieldItem;