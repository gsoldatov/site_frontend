import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import createStore from "../store/create-store";
import TagsContainer from "./tags/tags-container";
import TagContainer from "./tag/tag-container";
import Objects from "./objects/objects";


function App () {
    return (
        <Provider store={createStore()}>
            <BrowserRouter>
                <Switch>
                    <Route exact path="/tags">
                        <TagsContainer />
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