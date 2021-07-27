import React from "react";
import ReactDOM from "react-dom";
import { Switch, Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByPlaceholderText, waitFor } from "@testing-library/dom";

import { renderWithWrappers } from "./test-utils/render";
import { getEditedObjectLocalStorageKey } from "./test-utils/local-storage";
import { getSideMenuItem, getSideMenuDialogControls } from "./test-utils/ui-common";
import { getCurrentObject, waitForEditObjectPageLoad, getObjectTypeSwitchElements, clickDataTabButton, resetObject } from "./test-utils/ui-object";
import { addANewSubobject, clickSubobjectCardDataTabButton, getSubobjectCardAttributeElements, getSubobjectCards } from "./test-utils/ui-composite";

import { AddObject, EditObject } from "../src/components/object";
import Objects from "../src/components/objects";
import { getMappedSubobjectID } from "./mocks/data-composite";
import createStore from "../src/store/create-store";


/*
    /objects/add page tests.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("./mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);

        localStorage.clear();
    });
});


describe("New object page", () => {
    test("Unsaved object persistance", async () => {
        // Render new object page and modify object name
        let storeOne = createStore({ useLocalStorage: true, saveTimeout: 50 });
        
        var { container } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add",
            store: storeOne
        });

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
        let storeTwo = createStore({ useLocalStorage: true });
        var { container } = renderWithWrappers(<Route exact path="/objects/:id"><AddObject /></Route>, {
            route: "/objects/add",
            store: storeTwo
        });

        // Check if object name persisted
        objectNameInput = getByPlaceholderText(container, "Object name");
        expect(objectNameInput.value).toEqual(objectNameValue);
    });


    test("New composite object save", async () => {
        // Render new object page
        let store = createStore({ useLocalStorage: true, saveTimeout: 50 });

        let { container, history } = renderWithWrappers(
            <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, 
            { route: "/objects/add", store }
        );

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
        await waitFor(() => expect(store.getState().editedObjects[newSubobjectID].link).toEqual(newSubobjectLink));

        // Save the object
        fireEvent.click(getSideMenuItem(container, "Save"));
        const object_id = 1000; // mock object returned has this id
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/${object_id}`));
        
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


describe("Existing object page", () => {
    test("Unsaved object persistance", async () => {
        // Render existing object page and modify object name
        let storeOne = createStore({ useLocalStorage: true, saveTimeout: 50 });

        var { container } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/1", 
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
        let storeTwo = createStore({ useLocalStorage: true });
        var { container } = renderWithWrappers(<Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />, {
            route: "/objects/1", 
            store: storeTwo
        });
        await waitForEditObjectPageLoad(container, storeTwo);

        // Check if object name persisted
        objectNameInput = getByPlaceholderText(container, "Object name");
        expect(objectNameInput.value).toEqual(objectNameValue);
    });


    test("Unchanged composite object removal", async () => {
        // Render existing object page and modify object name
        let store = createStore({ useLocalStorage: true, saveTimeout: 50 });

        var { container } = renderWithWrappers(
            <Switch>
                <Route exact path="/objects"><Objects /></Route>
                <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />
            </Switch>, 
            { route: "/objects/3001", store }
        );
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
        let store = createStore({ useLocalStorage: true, saveTimeout: 50 });

        var { container } = renderWithWrappers(
            <Switch>
                <Route exact path="/objects"><Objects /></Route>
                <Route exact path="/objects/:id" render={ props => props.match.params.id === "add" ? <AddObject /> : <EditObject /> } />
            </Switch>, 
            { route: "/objects/3001", store }
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
