import React from "react";

// TODO форма с данными по тэгу (либо пустая форма)
class TagField extends React.Component {
    constructor (props) {
        super(props);
        this.state = this.props.tag ? Object.assign({}, this.props.tag) : {
            tag_name: "", tag_description: "", created_at: "", modified_at: ""
        };

        this.tag_description = React.createRef();
        this.handleTagNameChange = this.handleTagNameChange.bind(this);
        this.handleTagDescriptionChange = this.handleTagDescriptionChange.bind(this);
    }

    handleTagNameChange(e) {
        this.setState({tag_name: e.target.value});
    }

    handleTagDescriptionChange(e) {
        this.setState({tag_description: e.target.value});
    }

    componentWillUnmount() {
        alert("In componentWillUnmount");
    }

    // Update the height of textare to the size of its text
    componentDidUpdate() {
        // reset
        this.tag_description.current.style.height = "inherit";
        // set to text height
        this.tag_description.current.style.height = this.tag_description.current.scrollHeight + "px";
    }

    render() {
        const created_at = this.state.created_at && (
            <div className="item-field-date">
                <span className="item-field-date-label">Created at: </span>
                <span className="item-field-date-value">{this.state.created_at}</span>
            </div>
        );
        const modified_at = this.state.modified_at && (
            <div className="item-field-date">
                <span className="item-field-date-label">Modified at: </span>
                <span className="item-field-date-value">{this.state.modified_at}</span>
            </div>
        );
        const timestamps = this.state.created_at && (
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
                        <input type="text" name="tag_name" value={this.state.tag_name} 
                            onChange={this.handleTagNameChange}
                            className="item-field-form-text-input" />
                        <label htmlFor="tag_description" className="item-field-form-label">
                            Tag description
                        </label>
                        <textarea name="tag_description" value={this.state.tag_description}
                            ref={this.tag_description}
                            onChange={this.handleTagDescriptionChange}
                            className="item-field-form-text-area" />
                    </form>
                    <h3 className="item-field-header">Linked Tags</h3>
                    <div className="item-field-container">
                        tag1, tag2, tag3 ...
                    </div>
                    <h3 className="item-field-header">Objects with This Tag</h3>
                    <div className="item-field-container">
                        obj1, obj2, obj3
                    </div>
                </section>
            </main>
        );
    }
}

export default TagField;