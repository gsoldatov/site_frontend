import React from "react";

class FieldItemList extends React.Component {
    constructor(props) {
        super(props);
        this.fieldItemListDiv = React.createRef();
        this.handleExpandButtonClick = this.handleExpandButtonClick.bind(this);
        this.checkIfExpandButtonRequired = this.checkIfExpandButtonRequired.bind(this);
        this.checkItemListScrollHeight = this.checkItemListScrollHeight.bind(this);
        
        this.state = { isExpanded: false, isExpandButtonRequired: false };
        
        this.checkScheduled = false;
        
        this.lastCheckTime = new Date();
        this.lastCheckTime.setTime(this.lastCheckTime.getTime() - 1000);
    }

    handleExpandButtonClick(e) {
        this.setState({ isExpanded: !this.state.isExpanded })
    }

    checkItemListScrollHeight() {
        // Check if expand/collapse button needs to be displayed and update the state accordingly
        const itemListLineHeight = parseInt(                // line-height CSS property
            getComputedStyle(this.fieldItemListDiv.current)
            .lineHeight.
            replace("px", "")
        );
        const itemListScrollHeight = this.fieldItemListDiv.current.scrollHeight;            // total height of the ItemList div
        let newIsExpandButtonRequired = itemListScrollHeight >= 2 * itemListLineHeight;

        if (newIsExpandButtonRequired !== this.state.isExpandButtonRequired) {
            this.setState({ isExpandButtonRequired: newIsExpandButtonRequired });
        }

        this.lastCheckTime = new Date();
        this.checkScheduled = false;
    };

    checkIfExpandButtonRequired() {
        // Checks if expand/collapse button is required after component is mounted/updated or window is resized. Check number is limited to 1 per 0.1 second.
        if (!this.props.isExpandable) {
            return false;
        }

        let timeFromLastCheck = Date.now() - this.lastCheckTime;
        if (timeFromLastCheck >= 100) {
            this.checkItemListScrollHeight();
        } else if (!this.checkScheduled) {
            setTimeout(this.checkItemListScrollHeight, 100 - timeFromLastCheck);
            this.checkScheduled = true;
        }
       
    }

    componentDidMount() {
        this.checkIfExpandButtonRequired();
        window.addEventListener("resize", this.checkIfExpandButtonRequired)
    }

    componentDidUpdate() {
        this.checkIfExpandButtonRequired();
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.checkIfExpandButtonRequired)
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