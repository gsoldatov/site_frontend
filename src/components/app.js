import React from "react";
import "semantic-ui-css/semantic.min.css";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import createStore from "../store/create-store";

import { LocationManagerWrapper } from "./common/location-manager-wrapper";
import { ProtectedRoute } from "./common/protected-route";

import { IndexPage } from "./pages/index";
import { SearchPage } from "./pages/search";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { AdminPage } from "./pages/admin";
import { UsersPage } from "./pages/users";
import { TagsEditNew, TagsEditExisting } from "./pages/tags-edit";
import { TagsView } from "./pages/tags-view";
import { TagsListPage } from "./pages/tags-list";
import { ObjectsEditNew, ObjectsEditExisting } from "./pages/objects-edit";
import { ObjectsView } from "./top-level/objects-view";
import { ObjectsEdited } from "./pages/objects-edited";
import { ObjectsListPage } from "./pages/objects-list";
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
                    <UsersPage />
                </Route>

                {/* Tags */}
                <Route exact path="/tags/list">
                    <TagsListPage />
                </Route>

                <Route exact path="/tags/view">
                    <TagsView />
                </Route>
                
                <ProtectedRoute exact path="/tags/edit/new"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <TagsEditNew />
                </ProtectedRoute>
                <ProtectedRoute exact path="/tags/edit/:id"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <TagsEditExisting />
                </ProtectedRoute>

                {/* Objects */}
                <ProtectedRoute exact path="/objects/list"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsListPage />
                </ProtectedRoute>
                
                <ProtectedRoute exact path="/objects/edited"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsEdited />
                </ProtectedRoute>
                
                <ProtectedRoute exact path="/objects/edit/new"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsEditNew />
                </ProtectedRoute>
                <ProtectedRoute exact path="/objects/edit/:id"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsEditExisting />
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
