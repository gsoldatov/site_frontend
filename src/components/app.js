import React from "react";
import "semantic-ui-css/semantic.min.css";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import createStore from "../store/create-store";

import { LocationManagerWrapper } from "./common/location-manager-wrapper";
import { ProtectedRoute } from "./common/protected-route";

import { IndexPage } from "./top-level/index/index";
import { SearchPage } from "./top-level/search/search";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { AdminPage } from "./pages/admin";
import { UserPage } from "./top-level/user";
import { NewTag, EditTag } from "./top-level/tags-edit";
import { TagsView } from "./top-level/tags-view/tags-view";
import TagsList from "./top-level/tags-list";
import { NewObject, EditObject } from "./top-level/objects-edit";
import { ObjectsView } from "./top-level/objects-view";
import { ObjectsEdited } from "./pages/objects-edited";
import ObjectsList from "./top-level/objects-list";
import { NotFound } from "./pages/not-found";

import { enumUserLevels } from "../util/enum-user-levels";


export const isAuthenticatedCondition = state => state.auth.numeric_user_level > enumUserLevels.anonymous;
export const isAuthenticatedAdminCondition = state => state.auth.numeric_user_level === enumUserLevels.admin;
export const isAnonymousCondition = state => state.auth.numeric_user_level === enumUserLevels.anonymous;


export const App = () => {
    return (
        <LocationManagerWrapper>
            <Switch>
                {/* Index */}
                <Route exact path={["/", "/feed/:page"]}>
                    <IndexPage />
                </Route>

                {/* Search */}
                <Route exact path="/search">
                    <SearchPage />
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
                <Route exact path="/tags/list">
                    <TagsList />
                </Route>

                <Route exact path="/tags/view">
                    <TagsView />
                </Route>
                
                <ProtectedRoute exact path="/tags/edit/new"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <NewTag />
                </ProtectedRoute>
                <ProtectedRoute exact path="/tags/edit/:id"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <EditTag />
                </ProtectedRoute>

                {/* Objects */}
                <ProtectedRoute exact path="/objects/list"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsList />
                </ProtectedRoute>
                
                <ProtectedRoute exact path="/objects/edited"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsEdited />
                </ProtectedRoute>
                
                <ProtectedRoute exact path="/objects/edit/new"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <NewObject />
                </ProtectedRoute>
                <ProtectedRoute exact path="/objects/edit/:id"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <EditObject />
                </ProtectedRoute>

                <Route exact path="/objects/view/:id">
                    <ObjectsView />
                </Route>

                {/* Not found */}
                <Route>
                    <NotFound />
                </Route>
            </Switch>
        </LocationManagerWrapper>
    );
};


export const WrappedApp = () => {
    const store = createStore();
    if (!document.app) document.app = {};
    document.app.store = store;

    return (
        <Provider store={store}>
            <DndProvider backend={HTML5Backend}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </DndProvider>
        </Provider>
    );
};
