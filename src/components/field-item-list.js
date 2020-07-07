import React from "react";
import intervalWrapper from "../util/interval-wrapper";

class FieldItemList extends React.Component {
    constructor(props) {
        super(props);
        this.fieldItemListDiv = React.createRef();
        
        this.state = { isExpanded: false, isExpandButtonRequired: false };

        if (this.props.isExpandable) {
            this.handleExpandButtonClick = this.handleExpandButtonClick.bind(this);
            this.checkItemListScrollHeight = this.checkItemListScrollHeight.bind(this);
            this.onResizeRunner = intervalWrapper(this.checkItemListScrollHeight, 100, false);      // wrap checkItemListScrollHeight to limit its execution frequency
        }
    }

    handleExpandButtonClick(e) {
        this.setState({ isExpanded: !this.state.isExpanded })
    }

    checkItemListScrollHeight() {
        const itemListLineHeight = parseInt(getComputedStyle(this.fieldItemListDiv.current).lineHeight.replace("px", ""));      // line-height CSS property
        const itemListScrollHeight = this.fieldItemListDiv.current.scrollHeight;            // total height of the ItemList div
        let newIsExpandButtonRequired = itemListScrollHeight >= 2 * itemListLineHeight;

        if (newIsExpandButtonRequired !== this.state.isExpandButtonRequired) {
            this.setState({ isExpandButtonRequired: newIsExpandButtonRequired });
        }
    };

    componentDidMount() {
        if (this.props.isExpandable) {
            this.onResizeRunner();
            window.addEventListener("resize", this.onResizeRunner);
        }
    }

    componentDidUpdate() {
        if (this.props.isExpandable) {
            this.onResizeRunner();
        }
    }

    componentWillUnmount() {
        if (this.props.isExpandable) {
            window.removeEventListener("resize", this.onResizeRunner);
        }
    }

    render() {
        if (this.props.isFetching) {
            return (<div>Loading...</div>);
        }

        if (this.props.fetchError) {
            return (<div>{this.props.fetchError}</div>);
        }

        const itemListDivClassName = !this.props.isExpandable || this.state.isExpanded ? "field-item-list" : "field-item-list-collapsed";
        const itemListContainerClassName = this.props.isExpandable && !this.state.isExpandButtonRequired && this.props.items.length > 0 ? "field-item-list-container-bordered" : "field-item-list-container";
        const buttonText = this.state.isExpanded ? "ᐱ" : "ᐯ";
        
        const expandDiv = this.props.isExpandable && this.state.isExpandButtonRequired
            ? (
            <div className="field-item-list-expand-div">
                <button className="field-item-list-expand-button" onClick={this.handleExpandButtonClick}>{buttonText}</button>
            </div>
            )
            : null;
        
        return (
            <div className={itemListContainerClassName}>
                <div ref={this.fieldItemListDiv} className={itemListDivClassName}>
                    {this.props.items}
                </div>
                {expandDiv}
            </div>
        );
    }
}

export default FieldItemList;