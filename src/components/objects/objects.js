import React from "react";
import Navigation from "../navigation";

/*
    Component which renders /objects page.
    
    TODO add more comments?
*/
class Objects extends React.Component {
    render() {
        return (
            <div className="layout-div">
                <Navigation />
                <br/>
                <div>Objects page</div>
            </div>
            
        );
    }
}

export default Objects;