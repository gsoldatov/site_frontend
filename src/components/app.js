import React from "react";
import "semantic-ui-css/semantic.min.css";
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import createStore from "../store/create-store";
import { AddTag, EditTag } from "./tag";
import Tags from "./tags";
import { AddObject, EditObject } from "./object";
import Objects from "./objects";


export const App = () => {
    return (
        <Switch>
            <Route exact path="/tags">
                <Tags />
            </Route>
            <Route exact path="/tags/:id" render={props => props.match.params.id === "add" ? <AddTag /> : <EditTag /> }/>
            <Route exact path={["/objects", "/"]}>
                <Objects />
            </Route>
            <Route exact path="/objects/:id" render={props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> }/>
        </Switch>
    )
};


export const AppWithRouterAndStore = () => {
    return (
        <Provider store={createStore({ enableDebugLogging: true })}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </Provider>
    );
};
