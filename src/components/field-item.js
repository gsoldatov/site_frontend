import React from "react";
import { Link } from "react-router-dom";

class FieldItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isSelected: this.props.isSelected
        };

        this.handleCheckboxToggle = this.handleCheckboxToggle.bind(this);
    }

    handleCheckboxToggle(e) {
        this.setState({
            isSelected: !this.state.isSelected
        },
        () => this.props.onCheck(this.setState)
        );
    }

    render() {
        return (
            <div className="field-item">
                <input type="checkbox" checked={this.state.isSelected} 
                    onChange={this.handleCheckboxToggle}
                    className="field-item-tag-checkbox" />
                <Link to={this.props.onClickRedirectURL} className="field-item-tag-link">
                    {this.props.text}
                </Link>
            </div>
        );
    }
}

export default FieldItem;