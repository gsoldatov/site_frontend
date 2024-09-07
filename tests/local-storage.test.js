import React from "react";
import ReactDOM from "react-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor } from "@testing-library/dom";

import { renderWithWrappers } from "./_util/render";
import { getEditedObjectLocalStorageKey, waitForAuthInfoToBeSavedIntoLocalStorage } from "./_util/local-storage";
import { getSideMenuItem, getSideMenuDialogControls } from "./_util/ui-common";
import { getCurrentObject, waitForEditObjectPageLoad, getObjectTypeSwitchElements, clickDataTabButton, resetObject } from "./_util/ui-objects-edit";
import { addANewSubobject, clickSubobjectCardDataTabButton, getSubobjectCardAttributeElements, getSubobjectCards } from "./_util/ui-composite";
import { createTestStore } from "./_util/create-test-store";
import { getMappedSubobjectID } from "./_mocks/data-composite";

import { App } from "../src/components/top-level/app";

import { getDefaultAuthState } from "../src/store/state-templates/auth";

import { getConfig, setConfig } from "../src/config";

import { setAuthInformation } from "../src/actions/auth";



/*
    /objects/edit/new page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("./_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);

        localStorage.clear();
    });
});


describe("Edited objects > New object page", () => {
    test("Unsaved object persistence", async () => {
        // Render new object page and modify object name
        let storeOne = createTestStore({ useLocalStorage: true });
        
        var { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new",
            store: storeOne
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        const objectNameValue = "new object";
        let objectNameInput = getByPlaceholderText(container, "Object name");
        fireEvent.change(objectNameInput, { target: { value: objectNameValue } });
        await waitFor(() => expect(getCurrentObject(storeOne.getState()).object_name).toBe(objectNameValue));

        // Wait for changes to be saved in local storage
        await waitFor(() => {
            // Edited objects list
            const editedObjectsList = localStorage.getItem("savedEditedObjects");
            const parsedEditedObjectsList = JSON.parse(editedObjectsList);
            expect(parsedEditedObjectsList.length).toEqual(1);
            expect(parsedEditedObjectsList[0]).toEqual("0");

            // New object
            const savedEditedObject = localStorage.getItem(getEditedObjectLocalStorageKey(0));
            expect(savedEditedObject).toBeTruthy();
            const editedObject = JSON.parse(savedEditedObject);
            expect(editedObject.object_name).toEqual(objectNameValue);
        });

        // Unmount renredered page
        ReactDOM.unmountComponentAtNode(container);

        // Rerender page with another store
        let storeTwo = createTestStore({ useLocalStorage: true });
        var { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new",
            store: storeTwo
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Check if object name persisted
        objectNameInput = getByPlaceholderText(container, "Object name");
        expect(objectNameInput.value).toEqual(objectNameValue);
    });


    test("New composite object save", async () => {
        // Render new object page
        let store = createTestStore({ useLocalStorage: true });

        let { container, historyManager } = renderWithWrappers(<App />, 
            { route: "/objects/edit/new", store }
        );

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Set object name and type
        const objectNameValue = "new object";
        let objectNameInput = getByPlaceholderText(container, "Object name");
        fireEvent.change(objectNameInput, { target: { value: objectNameValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(objectNameValue));

        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);

        // Add a new subobject
        clickDataTabButton(container);
        addANewSubobject(container);
        const cards = getSubobjectCards(container, { expectedNumbersOfCards: [1] });
        const newSubobjectID = cards[0][0].id;

        // Modify new subobject
        const newSubobjectName = "new subobject", newSubobjectLink = "http://new.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][0]).subobjectNameInput, { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[newSubobjectID].object_name).toEqual(newSubobjectName));
        clickSubobjectCardDataTabButton(cards[0][0]);
        fireEvent.change(getByPlaceholderText(cards[0][0], "Link"), { target: { value: newSubobjectLink }});
        await waitFor(() => expect(store.getState().editedObjects[newSubobjectID].link.link).toEqual(newSubobjectLink));

        // Save the object
        fireEvent.click(getSideMenuItem(container, "Save"));
        const object_id = 1000; // mock object returned has this id
        await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);
        
        // Check added object and subobject
        const strObjectID = object_id.toString();
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(strObjectID));

        // Check subobject (is present in editedObjects under mapped ids)
        const state = store.getState();
        expect(state.editedObjects).not.toHaveProperty(newSubobjectID);
        const mappedSubobjectID = getMappedSubobjectID(newSubobjectID, "link").toString();
        expect(state.editedObjects).toHaveProperty(mappedSubobjectID);
        expect(state.editedObjects[mappedSubobjectID].object_name).toEqual(newSubobjectName);
        
        // Wait for changes to be saved in local storage
        await waitFor(() => {
            // Edited objects list
            const editedObjectsList = localStorage.getItem("savedEditedObjects");
            const parsedEditedObjectsList = JSON.parse(editedObjectsList);
            expect(parsedEditedObjectsList.length).toEqual(2);
            expect(parsedEditedObjectsList).toEqual(expect.arrayContaining([object_id.toString(), mappedSubobjectID.toString()]));
            
            // Object
            const savedEditedObject = localStorage.getItem(getEditedObjectLocalStorageKey(object_id));
            expect(savedEditedObject).toBeTruthy();
            const editedObject = JSON.parse(savedEditedObject);
            expect(editedObject.object_name).toEqual(objectNameValue);

            // Subobject
            const savedEditedSubobject = localStorage.getItem(getEditedObjectLocalStorageKey(mappedSubobjectID));
            expect(savedEditedSubobject).toBeTruthy();
            const editedSubbject = JSON.parse(savedEditedSubobject);
            expect(editedSubbject.object_name).toEqual(newSubobjectName);
        });
    });
});


describe("Edited objects > Existing object page", () => {
    test("Unsaved object persistence", async () => {
        // Render existing object page and modify object name
        let storeOne = createTestStore({ useLocalStorage: true });

        var { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", 
            store: storeOne
        });
        await waitForEditObjectPageLoad(container, storeOne);
        

        // Modify object name
        let objectNameInput = getByPlaceholderText(container, "Object name");
        const objectNameValue = "modified name";
        fireEvent.change(objectNameInput, { target: { value: objectNameValue } });
        await waitFor(() => expect(getCurrentObject(storeOne.getState()).object_name).toBe(objectNameValue));
        
        // Wait for changes to be saved in local storage
        await waitFor(() => {
            // Edited objects list
            const editedObjectsList = localStorage.getItem("savedEditedObjects");
            const parsedEditedObjectsList = JSON.parse(editedObjectsList);
            expect(parsedEditedObjectsList.length).toEqual(1);
            expect(parsedEditedObjectsList[0]).toEqual("1");

            // New object
            const savedEditedObject = localStorage.getItem(getEditedObjectLocalStorageKey(1));
            expect(savedEditedObject).toBeTruthy();
            const editedObject = JSON.parse(savedEditedObject);
            expect(editedObject.object_name).toEqual(objectNameValue);
        });

        // Unmount renredered page
        ReactDOM.unmountComponentAtNode(container);

        // Rerender page with another store
        let storeTwo = createTestStore({ useLocalStorage: true });
        var { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1", 
            store: storeTwo
        });
        await waitForEditObjectPageLoad(container, storeTwo);

        // Check if object name persisted
        objectNameInput = getByPlaceholderText(container, "Object name");
        expect(objectNameInput.value).toEqual(objectNameValue);
    });


    test("Unchanged composite object removal", async () => {
        // Render existing object page and modify object name
        let store = createTestStore({ useLocalStorage: true });

        var { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001", store 
        });
        await waitForEditObjectPageLoad(container, store);

        // Modify object name
        let objectNameInput = getByPlaceholderText(container, "Object name");
        const objectNameValue = "modified name";
        fireEvent.change(objectNameInput, { target: { value: objectNameValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(objectNameValue));

        // Wait for an existing subobject to load
        clickDataTabButton(container);
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));
        const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        const subobjectID = card.id;

        // Modify subobject name
        const unmodifiedSubobjectName = store.getState().editedObjects[subobjectID].object_name;
        const newSubobjectName = "updated subobject name";
        fireEvent.change(getSubobjectCardAttributeElements(card).subobjectNameInput, { target: { value: newSubobjectName } });
        await waitFor(() => expect(store.getState().editedObjects[subobjectID].object_name).toEqual(newSubobjectName));

        // Wait for changes to be saved in local storage
        await waitFor(() => {
            // Subobject
            const savedEditedObject = localStorage.getItem(getEditedObjectLocalStorageKey(subobjectID));
            expect(savedEditedObject).toBeTruthy();
            const editedObject = JSON.parse(savedEditedObject);
            expect(editedObject.object_name).toEqual(newSubobjectName);
        });

        // Reset object with subobjects
        resetObject(container, true);

        // Wait for objects to be reset in local storage
        await waitFor(() => {
            // Subobject
            const savedEditedObject = localStorage.getItem(getEditedObjectLocalStorageKey(subobjectID));
            expect(savedEditedObject).toBeTruthy();
            const editedObject = JSON.parse(savedEditedObject);
            expect(editedObject.object_name).toEqual(unmodifiedSubobjectName);
        });

        // Click cancel button
        fireEvent.click(getSideMenuItem(container, "Cancel"));

        // Wait for objects to be removed from local storage
        await waitFor(() => {
            // Edited objects list
            const editedObjectsList = localStorage.getItem("savedEditedObjects");
            const parsedEditedObjectsList = JSON.parse(editedObjectsList);
            expect(parsedEditedObjectsList.length).toEqual(0);

            // Object and subobject
            expect(localStorage.getItem(getEditedObjectLocalStorageKey(3001))).toBeFalsy();
            expect(localStorage.getItem(getEditedObjectLocalStorageKey(subobjectID))).toBeFalsy();
        });
    });


    test("Deleted composite object removal", async () => {
        // Render existing object page and modify object name
        let store = createTestStore({ useLocalStorage: true });

        var { container } = renderWithWrappers(<App />,
            { route: "/objects/edit/3001", store }
        );
        await waitForEditObjectPageLoad(container, store);
    
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

        // Wait for object and subobjects to be saved in local storage
        await waitFor(() => {
            // Edited objects list
            const editedObjectsList = localStorage.getItem("savedEditedObjects");
            const parsedEditedObjectsList = JSON.parse(editedObjectsList);
            expect(parsedEditedObjectsList.length).toEqual(3);
            expect(parsedEditedObjectsList).toEqual(expect.arrayContaining(["3001", existingSubobjectID, newSubobjectID]));
        });

        // Delete composite object and subobjects
        let deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).checkbox);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);

        // Wait for objects to be removed from local storage
        await waitFor(() => {
            // Edited objects list
            const editedObjectsList = localStorage.getItem("savedEditedObjects");
            const parsedEditedObjectsList = JSON.parse(editedObjectsList);
            expect(parsedEditedObjectsList.length).toEqual(0);

            // Object and subobject
            expect(localStorage.getItem(getEditedObjectLocalStorageKey(3001))).toBeFalsy();
            expect(localStorage.getItem(getEditedObjectLocalStorageKey(existingSubobjectID))).toBeFalsy();
            expect(localStorage.getItem(getEditedObjectLocalStorageKey(newSubobjectID))).toBeFalsy();
        });
    });
});



describe("Auth information", () => {
    test("Save auth updates into local storage", async () => {
        const store = createTestStore({ useLocalStorage: true, localStorageSaveTimeout: 25, addAdminToken: false });
        let authInfo = getDefaultAuthState();

        // Modify each attribute in auth info and check if it's saved to the local storage
        for (let [k, v] of [["access_token", "some value"], ["access_token_expiration_time", "some value"], ["user_id", 50], ["numeric_user_level", 20]]) {
            authInfo[k] = v;
            store.dispatch(setAuthInformation(authInfo));
            await waitForAuthInfoToBeSavedIntoLocalStorage(authInfo);
        }
    });


    test("Load auth from local storage", async () => {
        let store = createTestStore({ useLocalStorage: true, localStorageSaveTimeout: 25, addAdminToken: false });
        
        // Check if default auth information is correctly loaded if no auth is saved in the local storage
        let authInfo = getDefaultAuthState();
        expect(store.getState().auth).toMatchObject(authInfo);
        expect(authInfo).toMatchObject(store.getState().auth);

        // Wait for auth info to be saved into local storage, then clear it
        await waitForAuthInfoToBeSavedIntoLocalStorage(authInfo);
        localStorage.clear();

        // Set a non-default auth info into localStorage, then check if it's correctly read into state on store initialization
        authInfo = { access_token: "some_token", access_token_expiration_time: (new Date()).toISOString(), user_id: 15, numeric_user_level: 10 }
        localStorage.setItem("authInfo", JSON.stringify(authInfo));

        store = createTestStore({ useLocalStorage: true, localStorageSaveTimeout: 25, addAdminToken: false });
        expect(store.getState().auth).toMatchObject(authInfo);
        expect(authInfo).toMatchObject(store.getState().auth);
    });
});


describe("Local storage configuration", () => {
    test("`useLocalStorage` toggling in runtime", async () => {
        // Render new object page and modify object name
        const localStorageSaveTimeout = 50;
        let store = createTestStore({ useAppConfig: true, useLocalStorage: true, debugLogging: false, localStorageSaveTimeout });
        
        var { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new", store
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Change edited object's name with local storage enabled and wait for changes to ba saved
        let objectNameValue = "first";
        const objectNameInput = getByPlaceholderText(container, "Object name");
        fireEvent.change(objectNameInput, { target: { value: objectNameValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(objectNameValue));

        await waitFor(() => {
            const savedEditedObject = localStorage.getItem(getEditedObjectLocalStorageKey(0));
            const editedObject = JSON.parse(savedEditedObject);
            expect(editedObject.object_name).toEqual(objectNameValue);
        });

        // Disable local storage use and check that edited object's modifications are not saved
        setConfig({ ...getConfig(), useLocalStorage: false });
        
        fireEvent.change(objectNameInput, { target: { value: "second" } });
        const time = performance.now();
        await waitFor(() => expect(performance.now() - time).toBeGreaterThan(localStorageSaveTimeout + 1), { interval: 10 });

        const savedEditedObject = localStorage.getItem(getEditedObjectLocalStorageKey(0));
        const editedObject = JSON.parse(savedEditedObject);
        expect(editedObject.object_name).toEqual(objectNameValue);

        // Enable local storage use and check that changes are saved into local storage again
        setConfig({ ...getConfig(), useLocalStorage: true });

        objectNameValue = "third";
        fireEvent.change(objectNameInput, { target: { value: objectNameValue } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(objectNameValue));

        await waitFor(() => {
            const savedEditedObject = localStorage.getItem(getEditedObjectLocalStorageKey(0));
            const editedObject = JSON.parse(savedEditedObject);
            expect(editedObject.object_name).toEqual(objectNameValue);
        });
    });
});
