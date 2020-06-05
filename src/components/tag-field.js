import React from "react";
import { Redirect } from "react-router-dom";


class TagField extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            tag: this.props.tag ? this.props.tag : {
                tag_id: "", tag_name: "", tag_description: "", created_at: "", modified_at: ""
            }
        }

        this.tag_description = React.createRef();
        this.handleTagNameChange = this.handleTagNameChange.bind(this);
        this.handleTagDescriptionChange = this.handleTagDescriptionChange.bind(this);
    }

    handleTagNameChange(e) {
        this.setState({
            tag: {
                ...this.state.tag, 
                tag_name: e.target.value
            } 
        }, 
        () => this.props.setCurrentTag(this.state.tag)
        );
    }

    handleTagDescriptionChange(e) {
        this.setState({
            tag: {
                ...this.state.tag, 
                tag_description: e.target.value
            } 
        }, 
        () => this.props.setCurrentTag(this.state.tag)
        );
    }

    componentWillUnmount() {
        alert("In componentWillUnmount");
    }

    componentDidUpdate(prevProps) {
        // Update the height of textarea to the size of its text
        if (this.tag_description.current){
            this.tag_description.current.style.height = "inherit";  // reset
            this.tag_description.current.style.height = this.tag_description.current.scrollHeight + "px";   // set to text height
        }

        // Push updated currentTag into component's state
        if (this.props.tag.tag_id !== 0 && prevProps.tag.tag_id === 0                       // after adding a new tag + after loading an uncached tag from backend
            || !prevProps.isAddTagPage && !this.props.isFetching && prevProps.isFetching    // after saving tag changes
            ) {
            this.setState({
                tag: this.props.tag
            });
        }
    }

    render() {
        if (this.props.redirectOnRender) {
            return <Redirect to={this.props.redirectOnRender} />;
        }

        return this.props.isAddTagPage ? this.renderAdd() : this.renderEdit();
    }

    renderAdd() {
        const fetchError = this.props.fetchError && (
            <div className="fetch-error-info">{this.props.fetchError}</div>
        );
        
        const tag = this.state.tag;

        return (
            <main>
                <section className="tag-page-body">
                    <h3 className="item-field-header">Add a New Tag</h3>
                    {fetchError}
                    <form className="item-field-form">
                        <label htmlFor="tag_name" className="item-field-form-label">
                            Tag name
                        </label>
                        <input type="text" name="tag_name" value={tag.tag_name} 
                            readOnly={false}
                            onChange={this.handleTagNameChange}
                            className="item-field-form-text-input" />
                        <label htmlFor="tag_description" className="item-field-form-label">
                            Tag description
                        </label>
                        <textarea name="tag_description" value={tag.tag_description}
                            ref={this.tag_description}
                            onChange={this.handleTagDescriptionChange}
                            className="item-field-form-text-area" />
                    </form>
                </section>
            </main>
        );
    }

    renderEdit() {
        if (this.props.isFetching) {
            return <div>Fetching data...</div>
        };

        if (this.props.fetchError) {
            return <div>Failed to fetch data: {this.props.fetchError}</div>
        }

        const tag = this.state.tag;

        const created_at = tag.created_at && (
            <div className="item-field-date">
                <span className="item-field-date-label">Created at: </span>
                <span className="item-field-date-value">{tag.created_at}</span>
            </div>
        );
        const modified_at = tag.modified_at && (
            <div className="item-field-date">
                <span className="item-field-date-label">Modified at: </span>
                <span className="item-field-date-value">{tag.modified_at}</span>
            </div>
        );
        const timestamps = tag.created_at && (
            <div className="item-field-timestamps">
                {created_at}
                {modified_at}
            </div>
        );
        return (
            <main>
                <section className="tag-page-body">
                    <h3 className="item-field-header">Tag Information</h3>
                    {timestamps}
                    <form className="item-field-form">
                        <label htmlFor="tag_name" className="item-field-form-label">
                            Tag name
                        </label>
                        <input type="text" name="tag_name" value={tag.tag_name} 
                            readOnly={false}
                            onChange={this.handleTagNameChange}
                            className="item-field-form-text-input" />
                        <label htmlFor="tag_description" className="item-field-form-label">
                            Tag description
                        </label>
                        <textarea name="tag_description" value={tag.tag_description}
                            ref={this.tag_description}
                            onChange={this.handleTagDescriptionChange}
                            className="item-field-form-text-area" />
                    </form>
                    <h3 className="item-field-header">Linked Tags</h3>
                    <div className="item-field-container">
                        tag1, tag2, tag3...
                    </div>
                    <h3 className="item-field-header">Objects with This Tag</h3>
                    <div className="item-field-container">
                        obj1, obj2, obj3...
                    </div>
                </section>
            </main>
        );
    }
}

export default TagField;