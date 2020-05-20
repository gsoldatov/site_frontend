import React from "react";
import FieldMenuButton from "./field-menu-button";
import FieldMenuFilter from "./field-menu-filter";

//TODO remove
import img from "../icons/test_img.png";

const itemTypes = {
    button: FieldMenuButton,
    filter: FieldMenuFilter
};

class FieldMenu extends React.Component {
    render() {
        const items = [];
        for (let i=0; i < 1; i++) {
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

        return (
            <section className="field-menu">
                <div className="field-menu-div">
                    {items}
                </div>
            </section>
        );
    }
}

// for (let i=0; i < 1; i++) {
//     // items.push(<li key={i} className="field-menu-button">{"item " + i}</li>);
//     items.push(<li key={i}>
//                     <FieldMenuButton src={img} />
//                 </li>);
// }
// for (let i=0; i < 1; i++) {
//     items.push(<li key={i+1000}>
//                     <FieldMenuButton src={img} buttonState={"inactive"}/>
//                 </li>);
// }
// for (let i=0; i < 1; i++) {
//     items.push(<li key={i+2000}>
//                     <FieldMenuButton src={img} buttonState={"pressed"}/>
//                 </li>);
// }
// for (let i=0; i < 1; i++) {
//     items.push(<li key={i+3000}>
//                     <FieldMenuFilter />
//                 </li>);
// }

export default FieldMenu;