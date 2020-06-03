import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import thunkMiddleware from "redux-thunk";

import createStore from "../store/create-store";
import Tags from "./tags";
import TagContainer from "./tag-container";
import Objects from "./objects";


function App () {
    return (
        <Provider store={createStore()}>
            <BrowserRouter>
                <Switch>
                    <Route exact path="/tags">
                        <Tags />
                    </Route>
                    <Route exact path="/tags/:id">
                        <TagContainer />
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