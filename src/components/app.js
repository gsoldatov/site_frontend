import React from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import Tags from "./tags";
import Tag from "./tag";
import Objects from "./objects";
import root from "../reducers/root";

const store = createStore(root);

function App () {
    return (
        <Provider store = {store}>
            <BrowserRouter>
                <Switch>
                    <Route exact path="/tags">
                        <Tags />
                    </Route>
                    <Route exact path="/tags/:id">
                        <Tag />
                    </Route>
                    <Route exact path="/objects">
                        <Objects />
                    </Route>
                    <Route exact path="/">
                        <Objects />
                    </Route>
                </Switch>
            </BrowserRouter>
        </Provider>
    );
}

export default App;