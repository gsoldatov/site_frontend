import React from "react";
import "semantic-ui-css/semantic.min.css";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import createStore from "../store/create-store";
import { setDocumentApp } from "../util/document-app";

import { WindowWidthProvider } from "./modules/wrappers/window-width-provider";
import { LocationManagerWrapper } from "./state-users/location-manager-wrapper";
import { ProtectedRoute } from "./modules/wrappers/protected-route";

import { IndexPage } from "./pages/index";
import { SearchPage } from "./pages/search";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { AdminPage } from "./pages/admin";
import { UsersPage } from "./pages/users";
import { TagsEditNewPage, TagsEditExistingPage } from "./pages/tags-edit";
import { TagsViewPage } from "./pages/tags-view";
import { TagsListPage } from "./pages/tags-list";
import { ObjectsEditNewPage, ObjectsEditExistingPage } from "./pages/objects-edit";
import { ObjectsViewPage } from "./pages/objects-view";
import { ObjectsEditedPage } from "./pages/objects-edited";
import { ObjectsListPage } from "./pages/objects-list";
import { NotFoundPage } from "./pages/not-found";

import { NumericUserLevel } from "../store/types/data/auth";


export const isAuthenticatedCondition = state => state.auth.numeric_user_level > NumericUserLevel.anonymous;
export const isAuthenticatedAdminCondition = state => state.auth.numeric_user_level === NumericUserLevel.admin;
export const isAnonymousCondition = state => state.auth.numeric_user_level === NumericUserLevel.anonymous;


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
                    <TagsViewPage />
                </Route>
                
                <ProtectedRoute exact path="/tags/edit/new"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <TagsEditNewPage />
                </ProtectedRoute>
                <ProtectedRoute exact path="/tags/edit/:id"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <TagsEditExistingPage />
                </ProtectedRoute>

                {/* Objects */}
                <ProtectedRoute exact path="/objects/list"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsListPage />
                </ProtectedRoute>
                
                <ProtectedRoute exact path="/objects/edited"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsEditedPage />
                </ProtectedRoute>
                
                <ProtectedRoute exact path="/objects/edit/new"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsEditNewPage />
                </ProtectedRoute>
                <ProtectedRoute exact path="/objects/edit/:id"
                    childrenRenderedSelector={isAuthenticatedCondition} fallbackRoute="/auth/login" addQueryString>
                    <ObjectsEditExistingPage />
                </ProtectedRoute>

                <Route exact path="/objects/view/:id">
                    <ObjectsViewPage />
                </Route>

                {/* Not found */}
                <Route>
                    <NotFoundPage />
                </Route>
            </Switch>
        </LocationManagerWrapper>
    );
};


export const WrappedApp = () => {
    const store = createStore();
    setDocumentApp({ store });

    return (
        <Provider store={store}>
            <DndProvider backend={HTML5Backend}>
                <BrowserRouter>
                    <WindowWidthProvider>
                        <App />
                    </WindowWidthProvider>
                </BrowserRouter>
            </DndProvider>
        </Provider>
    );
};
