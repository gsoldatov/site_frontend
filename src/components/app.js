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
import { EditedObjects } from "./edited-objects";
import Objects from "./objects";
import { NotFound } from "./not-found";


export const App = () => {
    EditedObjects

    return (
        <Switch>
            {/* Tags */}
            <Route exact path="/tags">
                <Tags />
            </Route>
            
            <Route exact path="/tags/add">
                <AddTag />
            </Route>
            <Route exact path="/tags/:id">
                <EditTag />
            </Route>

            {/* Objects */}
            <Route exact path={["/objects", "/"]}>
                <Objects />
            </Route>
            
            <Route exact path="/objects/edited">
                <EditedObjects />
            </Route>
            <Route exact path="/objects/add">
                <AddObject />
            </Route>
            <Route exact path="/objects/:id">
                <EditObject />
            </Route>

            <Route>
                <NotFound />
            </Route>
        </Switch>
    );
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
