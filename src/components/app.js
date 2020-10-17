import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import createStore from "../store/create-store";
import TagsContainer from "./tags/tags-container";
import { AddTag, EditTag } from "./tag/tag";
import Objects from "./objects/objects";

export function App() {
    return (
        <Switch>
            <Route exact path="/tags">
                <TagsContainer />
            </Route>
            <Route exact path="/tags/:id" render={props => props.match.params.id === "add" ? <AddTag /> : <EditTag /> }/>
            <Route exact path="/objects">
                <Objects />
            </Route>
            <Route exact path="/">
                <Objects />
            </Route>
        </Switch>
    );
};

export function AppWithRouterAndStore() {
    return (
        <Provider store={createStore({ enableDebugLogging: true })}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </Provider>
    );
};
