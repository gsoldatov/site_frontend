import React from "react";

class FieldItemList extends React.Component {
    render() {
        let items = [];
        for (let item of this.props.items){
            let FieldItem = this.props.getFieldItemComponent();
            items.push(
                <FieldItem key={item.id} checked={item.checked} 
                    text={item.text} link={item.link}/>
            );
        }
        return (
            <div className="field-item-list">
                {items}
            </div>
        );
    }
}

export default FieldItemList;