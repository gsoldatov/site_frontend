import React from "react";
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import { createMemoryHistory } from "history";
import { render } from "@testing-library/react";
import { queryByText, queryAllByText } from "@testing-library/dom";

import createStore from "../src/store/create-store";

import { addObjects, selectObjects, setObjectsTags } from "../src/actions/objects";
import { getNonCachedTags } from "../src/actions/tags";


export function renderWithWrappers(ui, {
    store = createStore({ enableDebugLogging: false }),
    route = "/",
    history = createMemoryHistory({ initialEntries: [route] })
} = {}
) {
    function wrapper({ children }) {
        return (
            <Provider store={store}>
                <Router history={history}>
                    {children}
                </Router>
            </Provider>
        );
    }

    return { 
        ...render(ui, { wrapper: wrapper }),
        history,
        store
    };
}


export function compareArrays(a, b) {
    if (!(a instanceof Array && b instanceof Array)) throw new Exception("compareArrays received a non-array argument");
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) return false;
    return true;
}


// Creats a store with 2 selected objects in the state (for /objects page)
export async function getStoreWithTwoSelectedObjects() {
    
    let store = createStore({ useLocalStorage: false, enableDebugLogging: false });
    let objects = [ { object_id: 1, object_type: "link", object_name: "object #1", object_description: "object description", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4] },
                    { object_id: 2, object_type: "link", object_name: "object #2", object_description: "object description 2", 
                    created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 5, 6] } ];
    store.dispatch(addObjects(objects));
    store.dispatch(setObjectsTags(objects));
    store.dispatch(selectObjects([1, 2]));
    await store.dispatch(getNonCachedTags([6]));
    return store;
}


// Returns the input node of the InlineInput component inside the container
export const getInlineInputField = ({ container, currentQueryText }) => {
    let placeholder = queryByText(container, "Enter tag name...");
    if (!placeholder && currentQueryText) queryAllByText(container, currentQueryText).forEach(node => {
        if (node.parentNode.className.indexOf("default") > -1 && node.parentNode.className.indexOf("text") > -1) placeholder = node.parentNode;
    });
    if (!placeholder) return null;
    return placeholder.parentNode.querySelector("input");
};


// Returns the dropdown list node of the InlineInput component inside the container
export const getDropdownOptionsContainer = ({ container, currentQueryText }) => {
    const input = getInlineInputField({ container, currentQueryText });
    if (!input) return null;
    return input.parentNode.querySelector(".menu.transition");
};


// Returns the 
export const getTagInlineItem = ({ container, text }) => {
    let tag;
    queryAllByText(container, text).forEach(node => {
        if (node.className.indexOf("inline-item-text") > -1) tag = node;
    });
    return tag;
};


// Return mocked object type base on its ID
export function getObjectTypeFromID(objectID) {
    if (objectID >= 1 && objectID <= 1000) {
        return "link";
    } else if (objectID >= 1001 && objectID <= 2000) {
        return "markdown";
    } else {
        return "unknown";
    }
}
