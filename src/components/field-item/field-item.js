import React from "react";
import { Link } from "react-router-dom";

import StyleFieldItem from "../../styles/field-item.css";

/*
    Component which renders a single item with a link to its page and selection checkbox
    FieldItemContainer should be used instead of this class to connect it to the state.
*/
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

    componentDidUpdate() {
        // Update the checkbox state if the tag was checked/unchecked in another component (e.g. deselect the tag in the main FieldItemList after it's deselected in the selected FieldItemList)
        if (this.props.isSelected !== this.state.isSelected) {
            this.setState({ isSelected: this.props.isSelected });
        }
    }

    render() {
        return (
            <div className="field-item">
                <input type="checkbox" checked={this.state.isSelected} 
                    onChange={this.handleCheckboxToggle}
                    className="field-item-checkbox" />
                <Link to={this.props.onClickRedirectURL} className="field-item-link">
                    {this.props.text}
                </Link>
            </div>
        );
    }
}

export default FieldItem;