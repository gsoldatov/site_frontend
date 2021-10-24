import React from "react";
import "semantic-ui-css/semantic.min.css";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import createStore from "../../store/create-store";

import { ProtectedRoute } from "../common/protected-route";

import { IndexPage } from "./index";
import { LoginPage } from "./login";
import { RegisterPage } from "./register";
import { AdminPage } from "./admin";
import { UserPage } from "./user";
import { NewTag, EditTag } from "./tag";
import Tags from "./tags";
import { NewObject, EditObject } from "./objects-edit";
import { EditedObjects } from "./edited-objects";
import Objects from "./objects";
import { NotFound } from "./not-found";

import { enumUserLevels } from "../../util/enum-user-levels";


export const isAuthenticatedCondition = state => state.auth.numeric_user_level > enumUserLevels.anonymous;
export const isAuthenticatedAdminCondition = state => state.auth.numeric_user_level === enumUserLevels.admin;
export const isAnonymousCondition = state => state.auth.numeric_user_level === enumUserLevels.anonymous;


export const App = () => {
    return (
        <Switch>
            {/* Index */}
            <Route exact path="/">
                <IndexPage />
            </Route>

            {/* Admin */}
            <ProtectedRoute exact path="/admin" childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                <ProtectedRoute exact path="/admin"
                    childrenRenderedSelector={isAuthenticatedAdminCondition} fallbackRoute="/">
                    <AdminPage />
                </ProtectedRoute>
            </ProtectedRoute>

            {/* Auth */}
            <ProtectedRoute exact path="/auth/login"
                childrenRenderedSelector={isAnonymousCondition} fallbackRoute="/">
                <LoginPage />
            </ProtectedRoute>

            <ProtectedRoute exact path="/auth/register"
                childrenRenderedSelector={isAnonymousCondition} fallbackRoute="/">
                <RegisterPage />
            </ProtectedRoute>

            {/* Users */}
            <Route exact path="/users/:id">
                <UserPage />
            </Route>

            {/* Tags */}
            <ProtectedRoute exact path="/tags"
                childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                <Tags />
            </ProtectedRoute>
            
            <ProtectedRoute exact path="/tags/new"
                childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                <NewTag />
            </ProtectedRoute>
            <ProtectedRoute exact path="/tags/:id"
                childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                <EditTag />
            </ProtectedRoute>

            {/* Objects */}
            <ProtectedRoute exact path="/objects"
                childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                <Objects />
            </ProtectedRoute>
            
            <ProtectedRoute exact path="/objects/edited"
                childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                <EditedObjects />
            </ProtectedRoute>
            <ProtectedRoute exact path="/objects/edit/new"
                childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                <NewObject />
            </ProtectedRoute>
            <ProtectedRoute exact path="/objects/edit/:id"
                childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                <EditObject />
            </ProtectedRoute>

            {/* Not found */}
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
