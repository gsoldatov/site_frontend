import React from "react";
import "semantic-ui-css/semantic.min.css";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

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


export const WrappedApp = () => {
    return (
        <Provider store={createStore({ useLocalStorage: true, enableDebugLogging: true })}>
            <DndProvider backend={HTML5Backend}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </DndProvider>
        </Provider>
    );
};
