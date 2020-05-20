import React from "react";
import FieldMenu from "./field-menu";
import FieldBody from "./field-body";
import FieldItemTag from "./field-item-tag";

const items = [];

for (let i=1; i<=100; i++) {
    items.push({
        id: i,
        text: `tag ${i}`,
        checked: i % 6 <= 2,
        link: `/tags/${i}`
    });
}

class TagField extends React.Component {
    render() {
        return (
            <main>
                <div className="item-field">
                    <FieldMenu />
                    <FieldBody items={items}
                        getFieldItemComponent={(...args) => { return FieldItemTag; }} />
                </div>
            </main>
        );
    }
}

export default TagField;