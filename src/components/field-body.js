import React from "react";
import FieldItemList from "./field-item-list";
import FieldPagination from "./field-pagination";

class FieldBody extends React.Component {
    render() {
        return (
            <section className="field-body">
                <FieldItemList getFieldItemComponent={this.props.getFieldItemComponent} 
                    items={this.props.items} />
                <FieldPagination />
            </section>
        );
    }
}

export default FieldBody;