import React from "react";

class Main extends React.Component {
    render() {
        return (
            <main>
                {this.props.items}
            </main>
        );
    }
}

export default Main;
