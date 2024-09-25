import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, waitFor } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuDialogControls, getSideMenuItem } from "../../../../_util/ui-common";
import { clickDataTabButton } from "../../../../_util/ui-objects-edit";
import { addANewSubobject, getSubobjectCardAttributeElements, getSubobjectCards } from "../../../../_util/ui-composite";

import { App } from "../../../../../src/components/app";


/*
    /objects/edit/:id page tests for data deletion.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../../../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();
        
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});


test("Delete a link object with fetch error", async () => {
    let { container, store } = renderWithWrappers(<App />, {
        route: "/objects/edit/1"
    });

    // Wait for object information to be displayed on the page and try to delete the object
    await waitFor(() => getByText(container, "Object Information"));
    setFetchFail(true);
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    // Check if error message is displayed and object is not deleted from state
    await waitFor(() => getByText(container, "Failed to fetch data."));
    expect(store.getState().objects[1]).toBeTruthy();
    expect(store.getState().objectsTags[1]).toBeTruthy();
    expect(store.getState().links[1]).toBeTruthy();
});


test("Delete a link object", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/1"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);

    // Check if confirmation dialog has appeared
    expect(getSideMenuDialogControls(container).header.title).toEqual("Delete This Object?");
    fireEvent.click(getSideMenuDialogControls(container).buttons["No"]);
    expect(getSideMenuDialogControls(container)).toBeNull();

    // Check if delete removes the object and redirects
    deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    await waitFor(() => {
        expect(store.getState().objects[1]).toBeUndefined();
        expect(store.getState().objectsTags[1]).toBeUndefined();
        expect(store.getState().links[1]).toBeUndefined();
        expect(store.getState().editedObjects[1]).toBeUndefined();
    });
    await historyManager.waitForCurrentURLToBe("/objects/list");
});


test("Delete a markdown object", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/1001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));

    // Check if delete removes the object and redirects
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    await waitFor(() => {
        expect(store.getState().objects[1001]).toBeUndefined();
        expect(store.getState().objectsTags[1001]).toBeUndefined();
        expect(store.getState().markdown[1001]).toBeUndefined();
        expect(store.getState().editedObjects[1001]).toBeUndefined();
    });
    await historyManager.waitForCurrentURLToBe("/objects/list");
});


test("Delete a to-do list object", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/2001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));

    // Check if delete removes the object and redirects
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    await waitFor(() => {
        expect(store.getState().objects[2001]).toBeUndefined();
        expect(store.getState().objectsTags[2001]).toBeUndefined();
        expect(store.getState().toDoLists[2001]).toBeUndefined();
        expect(store.getState().editedObjects[2001]).toBeUndefined();
    });
    await historyManager.waitForCurrentURLToBe("/objects/list");
});


test("Delete a composite object without deleting subobjects", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));

    // Wait for an existing subobject to load
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);

    // Add a new subobject
    addANewSubobject(container);
    const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
    const [existingSubobjectID, newSubobjectID] = cards[0].map(card => card.id.toString());

    // Modify existing subobject
    let newSubobjectName = "updated name";
    fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: newSubobjectName } });
    await waitFor(() => expect(store.getState().editedObjects[existingSubobjectID].object_name).toEqual(newSubobjectName));

    // Delete composite object without deleting subobjects
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    // Check if redirect occured
    await historyManager.waitForCurrentURLToBe("/objects/list");
    const state = store.getState();

    // Check if composite object is removed from state
    expect(state.objects).not.toHaveProperty("3001");
    expect(state.composite).not.toHaveProperty("3001");
    expect(state.editedObjects).not.toHaveProperty("3001");
    
    // Check if new subobject is deleted
    expect(state.editedObjects).not.toHaveProperty(newSubobjectID);

    // Check if existing subobject is not deleted or reset
    expect(state.objects).toHaveProperty(existingSubobjectID);
    expect(state.links).toHaveProperty(existingSubobjectID);
    expect(state.objectsTags).toHaveProperty(existingSubobjectID);
    expect(state.editedObjects).toHaveProperty(existingSubobjectID);
    expect(state.editedObjects[existingSubobjectID].object_name).toEqual(newSubobjectName);
});


test("Delete a composite object and subobjects", async () => {
    let { container, store, historyManager } = renderWithWrappers(<App />, {
        route: "/objects/edit/3001"
    });

    // Wait for object information to be displayed on the page
    await waitFor(() => getByText(container, "Object Information"));

    // Wait for an existing subobject to load
    await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
    clickDataTabButton(container);

    // Add a new subobject
    addANewSubobject(container);
    const cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
    const [existingSubobjectID, newSubobjectID] = cards[0].map(card => card.id.toString());

    // Modify existing subobject
    let newSubobjectName = "updated name";
    fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: newSubobjectName } });
    await waitFor(() => expect(store.getState().editedObjects[existingSubobjectID].object_name).toEqual(newSubobjectName));

    // Delete composite object and subobjects
    let deleteButton = getSideMenuItem(container, "Delete");
    fireEvent.click(deleteButton);
    fireEvent.click(getSideMenuDialogControls(container).checkbox);
    fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

    // Check if redirect occured
    await historyManager.waitForCurrentURLToBe("/objects/list");
    const state = store.getState();

    // Check if composite object is removed from state
    expect(state.objects).not.toHaveProperty("3001");
    expect(state.composite).not.toHaveProperty("3001");
    expect(state.editedObjects).not.toHaveProperty("3001");
    
    // Check if new subobject is deleted
    expect(state.editedObjects).not.toHaveProperty(newSubobjectID);

    // Check if existing subobject is deleted
    expect(state.objects).not.toHaveProperty(existingSubobjectID);
    expect(state.links).not.toHaveProperty(existingSubobjectID);
    expect(state.objectsTags).not.toHaveProperty(existingSubobjectID);
    expect(state.editedObjects).not.toHaveProperty(existingSubobjectID);
});
