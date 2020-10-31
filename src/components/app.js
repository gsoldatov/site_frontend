import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import createStore from "../store/create-store";
import TagsContainer from "./tags/tags";
import { AddTag, EditTag } from "./tag/tag";
import { AddObject, EditObject } from "./object/object";
import ObjectsContainer from "./objects/objects";

export function App() {
    return (
        <Switch>
            <Route exact path="/tags">
                <TagsContainer />
            </Route>
            <Route exact path="/tags/:id" render={props => props.match.params.id === "add" ? <AddTag /> : <EditTag /> }/>
            <Route exact path="/objects">
                <ObjectsContainer />
            </Route>
            <Route exact path="/objects/:id" render={props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> }/>
            <Route exact path="/">
                <ObjectsContainer />
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
