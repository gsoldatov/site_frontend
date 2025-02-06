import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuItem } from "../../../../_util/ui-common";
import { getCurrentObject, getObjectTypeSwitchElements, clickGeneralTabButton, clickDataTabButton, 
    clickDisplayTabButton, clickPublishObjectCheckbox } from "../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, clickSubobjectCardDataTabButton, clickSubobjectCardDisplayTabButton, 
    getSubobjectCardAttributeElements, getSubobjectCardMenuButtons, getSubobjectCards, getSubobjectExpandToggleButton } from "../../../../_util/ui-composite";

import { App } from "../../../../../src/components/app";
import { getMappedSubobjectID } from "../../../../_mocks/data-composite";

/*
    /objects/edit/new page tests for saving objects.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail, addCustomRouteResponse } = require("../../../../_mocks/mock-fetch");
        
        // Set test app configuration
        resetTestConfig();

        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
        global.addCustomRouteResponse = jest.fn(addCustomRouteResponse);
    });
});


// describe("Save new object errors", () => {
//     test("Handle save fetch error", async () => {
//         let { container, store, historyManager } = renderWithWrappers(<App />, {
//             route: "/objects/edit/new"
//         });

//         // Wait for the page to load
//         await waitFor(() => getByText(container, "Add a New Object"));
    
//         // Check if an error message is displayed and object is not added to the state
//         let objectNameInput = getByPlaceholderText(container, "Object name");
//         let saveButton = getSideMenuItem(container, "Save");
//         fireEvent.change(objectNameInput, { target: { value: "error" } });
//         await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("error"));  // wait for object_name to be updated in state
    
//         clickDataTabButton(container);
//         let linkInput = getByPlaceholderText(container, "Link");
//         const linkValue = "https://google.com"
//         fireEvent.change(linkInput, { target: { value: linkValue } });
//         await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe(linkValue));
//         setFetchFail(true);
//         fireEvent.click(saveButton);
//         await waitFor(() => getByText(container, "Failed to fetch data."));
//         historyManager.ensureCurrentURL("/objects/edit/new");
//         expect(store.getState().objects[1000]).toBeUndefined(); // mock object returned has this id
//         setFetchFail();   // reset fetch fail
//     });


//     test("Link with incorrect data", async () => {
//         let { container, store } = renderWithWrappers(<App />, {
//             route: "/objects/edit/new"
//         });

//         // Wait for the page to load
//         await waitFor(() => getByText(container, "Add a New Object"));

//         const objectNameInput = getByPlaceholderText(container, "Object name");
//         const saveButton = getSideMenuItem(container, "Save");
    
//         // Set a valid object name
//         fireEvent.change(objectNameInput, { target: { value: "New object" } });
    
//         // Save an empty link
//         const { switchContainer, linkOption } = getObjectTypeSwitchElements(container);
//         fireEvent.click(switchContainer);
//         fireEvent.click(linkOption);
//         fireEvent.click(saveButton);
//         await waitFor(() => getByText(container, "Valid URL is required.", { exact: false }));
//         expect(store.getState().objects[1]).toBeUndefined();
//         expect(store.getState().links[1]).toBeUndefined();
//     });


//     test("Markdown with incorrect data", async () => {
//         let { container, store } = renderWithWrappers(<App />, {
//             route: "/objects/edit/new"
//         });

//         // Wait for the page to load
//         await waitFor(() => getByText(container, "Add a New Object"));
    
//         const objectNameInput = getByPlaceholderText(container, "Object name");
//         const saveButton = getSideMenuItem(container, "Save");
    
//         // Set a valid object name
//         fireEvent.change(objectNameInput, { target: { value: "New object" } });
    
//         // Save an empty markdown object
//         const { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
//         fireEvent.click(switchContainer);
//         fireEvent.click(markdownOption);
//         fireEvent.click(saveButton);
//         await waitFor(() => getByText(container, "Markdown text is required.", { exact: false }));
//         expect(store.getState().objects[1]).toBeUndefined();
//         expect(store.getState().markdown[1]).toBeUndefined();
//     });


//     test("To-do list with incorrect data", async () => {
//         let { container, store } = renderWithWrappers(<App />, {
//             route: "/objects/edit/new"
//         });

//         // Wait for the page to load
//         await waitFor(() => getByText(container, "Add a New Object"));

//         const objectNameInput = getByPlaceholderText(container, "Object name");
//         const saveButton = getSideMenuItem(container, "Save");
    
//         // Set a valid object name
//         fireEvent.change(objectNameInput, { target: { value: "New object" } });
    
//         // Save an empty to-do list object
//         const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
//         fireEvent.click(switchContainer);
//         fireEvent.click(toDoListOption);
//         fireEvent.click(saveButton);
//         await waitFor(() => getByText(container, "At least one item is required in the to-do list.", { exact: false }));
//         expect(store.getState().objects[1]).toBeUndefined();
//         expect(store.getState().toDoLists[1]).toBeUndefined();
//     });


//     test("Composite object without subobjects", async () => {
//         let { container, store, historyManager } = renderWithWrappers(<App />, {
//             route: "/objects/edit/new"
//         });

//         // Wait for the page to load
//         await waitFor(() => getByText(container, "Add a New Object"));

//         // Modify object name and type, then click save button
//         const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
//         fireEvent.click(switchContainer);
//         fireEvent.click(compositeOption);
//         fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
//         await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));
//         fireEvent.click(getSideMenuItem(container, "Save"));

//         // Check if error message is displayed and save did not occur
//         await waitFor(() => getByText(container, "Composite object must have at least one non-deleted subobject.", { exact: false }));
//         historyManager.ensureCurrentURL("/objects/edit/new");
//         expect(store.getState().objects[1]).toBeUndefined();
//         expect(store.getState().composite[1]).toBeUndefined();
//     });


//     test("Composite object without non-deleted subobjects", async () => {
//         let { container, store, historyManager } = renderWithWrappers(<App />, {
//             route: "/objects/edit/new"
//         });

//         // Wait for the page to load
//         await waitFor(() => getByText(container, "Add a New Object"));

//         // Modify object type and name
//         const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
//         fireEvent.click(switchContainer);
//         fireEvent.click(compositeOption);
//         fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
//         await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));

//         // Add 2 subobjects, then delete them
//         clickDataTabButton(container);
//         addANewSubobject(container);
//         await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
//         let cards = getSubobjectCards(container, { expectedNumbersOfCards: [2] });
//         fireEvent.click(getSubobjectCardMenuButtons(cards[0][0]).deleteButton);
//         fireEvent.click(getSubobjectCardMenuButtons(cards[0][1]).fullDeleteButton);

//         // Click save button and check if error message is displayed and save did not occur
//         fireEvent.click(getSideMenuItem(container, "Save"));
//         await waitFor(() => getByText(container, "Composite object must have at least one non-deleted subobject.", { exact: false }));
//         historyManager.ensureCurrentURL("/objects/edit/new");
//         expect(store.getState().objects[1]).toBeUndefined();
//         expect(store.getState().composite[1]).toBeUndefined();
//     });


//     test("Composite object a with a new subobject with incorrect attributes", async () => {
//         let { container, store, historyManager } = renderWithWrappers(<App />, {
//             route: "/objects/edit/new"
//         });

//         // Wait for the page to load
//         await waitFor(() => getByText(container, "Add a New Object"));

//         // Modify object type and name
//         const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
//         fireEvent.click(switchContainer);
//         fireEvent.click(compositeOption);
//         fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
//         await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));

//         // Add a new subobject and edit its data
//         clickDataTabButton(container);
//         addANewSubobject(container);
//         const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
//         clickSubobjectCardDataTabButton(card);
//         fireEvent.change(getByPlaceholderText(card, "Link"), { target: { value: "new link value" }});
//         await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toBe("new link value"));

//         // Click save button and check if error message is displayed and save did not occur
//         fireEvent.click(getSideMenuItem(container, "Save"));
//         await waitFor(() => getByText(container, "Object name is required.", { exact: false }));
//         historyManager.ensureCurrentURL("/objects/edit/new");
//         expect(store.getState().objects[1]).toBeUndefined();
//         expect(store.getState().composite[1]).toBeUndefined();
//         expect(store.getState().editedObjects).toHaveProperty(card.id);
//     });


//     test("Composite object a with an existing subobject with incorrect data", async () => {
//         let { container, store, historyManager } = renderWithWrappers(<App />, {
//             route: "/objects/edit/new"
//         });

//         // Wait for the page to load
//         await waitFor(() => getByText(container, "Add a New Object"));

//         // Modify object type and name
//         const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
//         fireEvent.click(switchContainer);
//         fireEvent.click(compositeOption);
//         fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
//         await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));

//         // Add an existing subobject and modify its data to be invalid
//         clickDataTabButton(container);
//         await addAnExistingSubobject(container, 0, "some name", store, { waitForObjectLoad: true });
//         const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
//         clickSubobjectCardDataTabButton(card);
//         fireEvent.change(getByPlaceholderText(card, "Link"), { target: { value: "" }});
//         await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toBe(""));

//         // Click save button and check if error message is displayed and save did not occur
//         fireEvent.click(getSideMenuItem(container, "Save"));
//         await waitFor(() => getByText(container, "Valid URL is required.", { exact: false }));
//         historyManager.ensureCurrentURL("/objects/edit/new");
//         expect(store.getState().objects[1]).toBeUndefined();
//         expect(store.getState().composite[1]).toBeUndefined();
//         expect(store.getState().editedObjects).toHaveProperty(card.id);
//     });
// });


describe("Save new object", () => {
    // test("Save link + check all attributes + check new object state reset", async () => {
    //     let { container, store, historyManager } = renderWithWrappers(<App />, {
    //         route: "/objects/edit/new" 
    //     });

    //     // Wait for the page to load
    //     await waitFor(() => getByText(container, "Add a New Object"));
    
    //     let objectNameInput = getByPlaceholderText(container, "Object name");
    //     let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    //     let saveButton = getSideMenuItem(container, "Save");
    
    //     // Check if object is redirected after adding a correct object
    //     fireEvent.change(objectNameInput, { target: { value: "new object" } });
    //     await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
    //     fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
    //     await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("new object description"));
    
    //     clickDataTabButton(container);
    //     let linkInput = getByPlaceholderText(container, "Link");
    //     const linkValue = "https://google.com"
    //     fireEvent.change(linkInput, { target: { value: linkValue } });
    //     await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe(linkValue));
        
    //     // Publish object
    //     expect(store.getState().editedObjects[0].is_published).toBeFalsy();
    //     clickDisplayTabButton(container);
    //     clickPublishObjectCheckbox(container);
    //     expect(store.getState().editedObjects[0].is_published).toBeTruthy();

    //     // Save object
    //     fireEvent.click(saveButton);
    //     const object_id = 1000; // mock object returned has this id
    //     await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);
            
    //     clickGeneralTabButton(container);
    //     expect(getByPlaceholderText(container, "Object name").value).toEqual("new object");
    //     expect(getByPlaceholderText(container, "Object description").value).toEqual("new object description");
    //     getByText(container, "Created at:");
    //     getByText(container, "Modified at:");

    //     clickDataTabButton(container);
    //     expect(getByPlaceholderText(container, "Link").value).toEqual(linkValue);    
    //     expect(store.getState().links[object_id].link).toEqual(linkValue);

    //     clickDisplayTabButton(container);
    //     expect(getByText(container, "Publish Object").parentNode.classList.contains("checked")).toBeTruthy();
    //     expect(store.getState().objects[object_id].is_published).toBeTruthy();
    
    //     // Check if new object state was reset
    //     expect(Object.keys(store.getState().editedObjects).includes("0")).toBeFalsy();  // numeric keys are converted to strings
    // });


    // test("Save markdown", async () => {
    //     let { container, store, historyManager } = renderWithWrappers(<App />, {
    //         route: "/objects/edit/new"
    //     });

    //     // Wait for the page to load
    //     await waitFor(() => getByText(container, "Add a New Object"));
    
    //     // Change object type
    //     const { switchContainer, markdownOption } = getObjectTypeSwitchElements(container);
    //     fireEvent.click(switchContainer);
    //     fireEvent.click(markdownOption);
    
    //     let objectNameInput = getByPlaceholderText(container, "Object name");
    //     let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    //     let saveButton = getSideMenuItem(container, "Save");
        
    //     // Enter attributes
    //     fireEvent.change(objectNameInput, { target: { value: "new object" } });
    //     await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
    //     fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
    //     await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("new object description"));
    
    //     // Change display mode and enter MD text
    //     clickDataTabButton(container);
    //     let editModeButton = getByTitle(container, "Display edit window")
    //     fireEvent.click(editModeButton);
    //     let inputForm = getByPlaceholderText(container, "Enter text here...");
    //     const rawText = "**Test text**";
    //     fireEvent.change(inputForm, { target: { value: rawText } });
    //     await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toEqual(rawText));
    
    //     // Check if object is redirected after adding a correct object
    //     fireEvent.click(saveButton);
    //     const object_id = 1000; // mock object returned has this id
    //     await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);
    //     expect(getByPlaceholderText(container, "Enter text here...").value).toEqual(rawText);
        
    //     clickGeneralTabButton(container);
    //     expect(getByPlaceholderText(container, "Object name").value).toEqual("new object");
    //     expect(getByPlaceholderText(container, "Object description").value).toEqual("new object description");
    //     getByText(container, "Created at:");
    //     getByText(container, "Modified at:");
    
    //     expect(store.getState().markdown[object_id].raw_text).toEqual(rawText);
    // });


    // test("Save to-do list", async () => {
    //     let { container, store, historyManager } = renderWithWrappers(<App />, {
    //         route: "/objects/edit/new"
    //     });

    //     // Wait for the page to load
    //     await waitFor(() => getByText(container, "Add a New Object"));
    
    //     // Change object type
    //     const { switchContainer, toDoListOption } = getObjectTypeSwitchElements(container);
    //     fireEvent.click(switchContainer);
    //     fireEvent.click(toDoListOption);
    
    //     let objectNameInput = getByPlaceholderText(container, "Object name");
    //     let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    //     let saveButton = getSideMenuItem(container, "Save");
    
    //     // Enter attributes
    //     fireEvent.change(objectNameInput, { target: { value: "new object" } });
    //     await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
    //     fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
    //     await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("new object description"));
    
    //     // Add a to-do list item
    //     clickDataTabButton(container);
    //     let newItemInput = getByPlaceholderText(container.querySelector(".to-do-list-item-container"), "New item");
    //     fireEvent.input(newItemInput, { target: { innerHTML: "new value" } });
    //     await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[0].item_text).toBe("new value"));
    
    //     // Check if object is redirected after adding a correct object
    //     fireEvent.click(saveButton);
    //     const object_id = 1000; // mock object returned has this id
    //     await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);
        
    //     let TDLContainer = container.querySelector(".to-do-list-container");
    //     getByText(TDLContainer, "new value");
    
    //     clickGeneralTabButton(container);
    //     expect(getByPlaceholderText(container, "Object name").value).toEqual("new object");
    //     expect(getByPlaceholderText(container, "Object description").value).toEqual("new object description");
    //     getByText(container, "Created at:");
    //     getByText(container, "Modified at:");
    //     expect(store.getState().toDoLists[object_id].items[0].item_text).toEqual("new value");
    // });

    
    test("Save composite", async () => {
        let { container, store, historyManager } = renderWithWrappers(<App />, {
            route: "/objects/edit/new" 
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Add a New Object"));

        // Modify object type and name
        const { switchContainer, compositeOption } = getObjectTypeSwitchElements(container);
        fireEvent.click(switchContainer);
        fireEvent.click(compositeOption);
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: "New object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("New object"));

        // Add 3 new & 4 existing subobjects
        clickDataTabButton(container);
        addANewSubobject(container);
        addANewSubobject(container);
        addANewSubobject(container);
        await addAnExistingSubobject(container, 0, "deleted existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "fully deleted existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "unmodified existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "existing to be modified", store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [7] });
        const [deletedNewID, firstNewID, secondNewID, deletedExistingID, fullyDeletedExistingID, unmodifiedExistingID, modifiedExistingID] = cards[0].map(card => card.id);

        // Delete 2 subobjects (new + existing), fully delete 1 existing subobject
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][0]).deleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][3]).deleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][4]).fullDeleteButton);

        // Modify new subobjects
        const firstNewName = "first new subobject", firstLink = "http://first.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][1]).subobjectNameInput, { target: { value: firstNewName } });
        await waitFor(() => expect(store.getState().editedObjects[firstNewID].object_name).toEqual(firstNewName));
        clickSubobjectCardDataTabButton(cards[0][1]);
        fireEvent.change(getByPlaceholderText(cards[0][1], "Link"), { target: { value: firstLink }});
        await waitFor(() => expect(store.getState().editedObjects[firstNewID].link.link).toEqual(firstLink));
        clickSubobjectCardDisplayTabButton(cards[0][1]);
        clickPublishObjectCheckbox(cards[0][1]);
        expect(store.getState().editedObjects[firstNewID].is_published).toBeTruthy();

        const secondNewName = "second new subobject", secondLink = "http://second.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][2]).subobjectNameInput, { target: { value: secondNewName } });
        await waitFor(() => expect(store.getState().editedObjects[secondNewID].object_name).toEqual(secondNewName));
        clickSubobjectCardDataTabButton(cards[0][2]);
        fireEvent.change(getByPlaceholderText(cards[0][2], "Link"), { target: { value: secondLink }});
        await waitFor(() => expect(store.getState().editedObjects[secondNewID].link.link).toEqual(secondLink));

        // Modify existing subobject and collapse its card
        const unModifiedExistingTimestamp = store.getState().objects[unmodifiedExistingID].modified_at;
        const modifiedExistingName = "modified existing", modifiedExistingLink = "http://modifed.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][6]).subobjectNameInput, { target: { value: modifiedExistingName } });
        await waitFor(() => expect(store.getState().editedObjects[modifiedExistingID].object_name).toEqual(modifiedExistingName));
        clickSubobjectCardDataTabButton(cards[0][6]);
        fireEvent.change(getByPlaceholderText(cards[0][6], "Link"), { target: { value: modifiedExistingLink }});
        await waitFor(() => expect(store.getState().editedObjects[modifiedExistingID].link.link).toEqual(modifiedExistingLink));
        fireEvent.click(getSubobjectExpandToggleButton(cards[0][6]));
        await waitFor(() => expect(store.getState().editedObjects[0].composite.subobjects[modifiedExistingID].is_expanded).toBeFalsy());

        // Check if object is redirected after adding a correct object
        fireEvent.click(getSideMenuItem(container, "Save"));
        const object_id = 1000; // mock object returned has this id
        await historyManager.waitForCurrentURLToBe(`/objects/edit/${object_id}`);
        
        // Check added object (is added to state.editedObjects & state.composite and has 4 subobjects in both states)
        const strObjectID = object_id.toString();
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(strObjectID));
        const state = store.getState();
        expect(state.composite).toHaveProperty(strObjectID);
        expect(Object.keys(state.composite[object_id].subobjects).length).toEqual(4);
        expect(Object.keys(state.editedObjects[object_id].composite.subobjects).length).toEqual(4);

        // Deleted new subobject, deleted and fully deleted existing subobjects
        for (let subobjectID of [deletedNewID, deletedExistingID, fullyDeletedExistingID]) {
            const strSubobjectID = subobjectID.toString();
            expect(state.editedObjects).not.toHaveProperty(strSubobjectID);
            expect(state.editedObjects[object_id].composite.subobjects).not.toHaveProperty(strSubobjectID);
            expect(state.composite[object_id].subobjects).not.toHaveProperty(strSubobjectID);
        }

        // First and second new subobjects (are present in editedObjects under mapped ids)
        for (let [subobjectID, subobjectName] of [[firstNewID, firstNewName], [secondNewID, secondNewName]]) {
            const strSubobjectID = subobjectID.toString();
            expect(state.editedObjects).not.toHaveProperty(strSubobjectID);
            
            const mappedID = getMappedSubobjectID(subobjectID, "link").toString();
            
            expect(state.editedObjects).toHaveProperty(mappedID);
            expect(state.editedObjects[mappedID].object_name).toEqual(subobjectName);

            expect(state.composite[object_id].subobjects).toHaveProperty(mappedID);
            expect(state.editedObjects[object_id].composite.subobjects).toHaveProperty(mappedID);

            expect(state.editedObjects[object_id].is_published).toEqual(subobjectID === firstNewName);  // first new subobject is published
        }

        // Unmodified and modified existing subobjects (are present in state.editedObjects and in subobjects of saved object)
        for (let subobjectID of [unmodifiedExistingID, modifiedExistingID]) {
            const strSubobjectID = subobjectID.toString();
            expect(state.editedObjects).toHaveProperty(strSubobjectID);
            expect(state.composite[object_id].subobjects).toHaveProperty(strSubobjectID);
            expect(state.editedObjects[object_id].composite.subobjects).toHaveProperty(strSubobjectID);
        }

        // Unmodified existing subobject (modified_at timestamp is not changed)
        expect(state.editedObjects[unmodifiedExistingID].modified_at).toEqual(unModifiedExistingTimestamp);
        expect(state.objects[unmodifiedExistingID].modified_at).toEqual(unModifiedExistingTimestamp);

        // Modified existing subobject (has updated modified_at & object_name, as well as is_expanded value)
        expect(state.objects[modifiedExistingID].object_name).toEqual(modifiedExistingName);
        expect(state.links[modifiedExistingID].link).toEqual(modifiedExistingLink);
        expect(state.editedObjects[modifiedExistingID].modified_at).toEqual(state.objects[object_id].modified_at);
        expect(state.objects[modifiedExistingID].modified_at).toEqual(state.objects[object_id].modified_at);
        expect(state.composite[object_id].subobjects[modifiedExistingID].is_expanded).toBeFalsy();

        // Rows of non-deleted subobjects are updated
        for (let subobjectsStorage of [state.composite[object_id].subobjects, state.editedObjects[object_id].composite.subobjects]) {
            expect(subobjectsStorage[getMappedSubobjectID(firstNewID, "link")].row).toEqual(0);
            expect(subobjectsStorage[getMappedSubobjectID(secondNewID, "link")].row).toEqual(1);
            expect(subobjectsStorage[unmodifiedExistingID].row).toEqual(2);
            expect(subobjectsStorage[modifiedExistingID].row).toEqual(3);
        }

        // Subobject cards are rendered
        clickDataTabButton(container);
        cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
        const expectedCardIDs = [getMappedSubobjectID(firstNewID, "link"), getMappedSubobjectID(secondNewID, "link"), unmodifiedExistingID, modifiedExistingID];
        for (let i = 0; i < 4; i++) expect(cards[0][i].id).toEqual(expectedCardIDs[i].toString());
    });
});
