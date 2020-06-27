import React from "react";
import FieldMenuButton from "./field-menu-button";
import FieldMenuFilter from "./field-menu-filter";
import img from "../icons/test_img.png";

export default function getTagsFieldMenuItems() {       // TODO fill with actual menu items
    const items = [];
    for (let i=0; i < 2; i++) {
        // items.push(<li key={i} className="field-menu-button">{"item " + i}</li>);
        items.push(<FieldMenuButton key={i} src={img} />);
    }
    for (let i=0; i < 1; i++) {
        items.push(<FieldMenuButton key={i + 1000} src={img} buttonState={"inactive"}/>);
    }
    for (let i=0; i < 1; i++) {
        items.push(<FieldMenuButton key={i + 2000} src={img} buttonState={"pressed"}/>);
    }
    for (let i=0; i < 1; i++) {
        items.push(<FieldMenuFilter key={i + 3000} />);
    }

    return items;
}
