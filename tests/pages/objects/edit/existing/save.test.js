import React from "react";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle, queryByPlaceholderText } from "@testing-library/dom";

import { resetTestConfig } from "../../../../_mocks/config";
import { compareArrays } from "../../../../_util/data-checks";
import { renderWithWrappers } from "../../../../_util/render";
import { getSideMenuItem } from "../../../../_util/ui-common";
import { getCurrentObject, clickDataTabButton, clickDisplayTabButton, clickPublishObjectCheckbox } from "../../../../_util/ui-objects-edit";
import { addANewSubobject, addAnExistingSubobject, clickSubobjectCardDataTabButton, clickSubobjectCardDisplayTabButton, 
    getSubobjectCardAttributeElements, getSubobjectCardMenuButtons, getSubobjectCards, getSubobjectExpandToggleButton } from "../../../../_util/ui-composite";

import { getMappedSubobjectID } from "../../../../_mocks/data-composite";

import { App } from "../../../../../src/components/app";


/*
    /objects/edit/:id page tests for saving objects.
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


describe("Update object errors", () => {
    test("Update a link object with fetch error", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
    
        // Wait for object information to be displayed on the page and try modifying the object
        await waitFor(() => getByText(container, "Object Information"));
        let oldObject = {...store.getState().objects[1]};
        let oldLink = {...store.getState().links[1]};
        let saveButton = getSideMenuItem(container, "Save");
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    
        // Modify attributes
        fireEvent.change(objectNameInput, { target: { value: "error" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("error"));
        fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("modified object description"));
    
        // Modify data
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe("https://test.link.modified"));
    
        // Check error message is displayed and object is not modified in the state
        setFetchFail(true);
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Failed to fetch data."));
        for (let attr of ["object_name", "object_description", "created_at", "modified_at"]) {
            expect(store.getState().objects[1][attr]).toEqual(oldObject[attr]);
        }
        expect(store.getState().links[1].link).toEqual(oldLink.link);
    });
    

    test("Save an empty link object", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
        let oldObjectData = {...store.getState().links[1]};
    
        // Check if an empty link is not saved
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        fireEvent.change(linkInput, { target: { value: "" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe(""));
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Valid URL is required.", { exact: false }));
        expect(store.getState().links[1].link).toEqual(oldObjectData.link);
    });


    test("Save an empty markdown object", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1001"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
        let oldObjectData = {...store.getState().markdown[1001]};
    
        // Clear raw text
        clickDataTabButton(container);
        const markdownContainer = document.querySelector(".markdown-editor-container");
        expect(markdownContainer).toBeTruthy();
        let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
        fireEvent.click(bothModeButton);
        let markdownInput = getByPlaceholderText(container, "Enter text here...");
        fireEvent.change(markdownInput, { target: { value: "" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toBe(""));
    
        // Check if an empty markdown is not saved
        fireEvent.click(saveButton);
        await waitFor(() => getByText(container, "Markdown text is required.", { exact: false }));
        expect(store.getState().markdown[1001].raw_text).toEqual(oldObjectData.raw_text);
    });


    test("Composite object a with a new subobject with incorrect attributes", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
        });

        // Wait for object and its subobject to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));

        // Add a new subobject and edit its data
        clickDataTabButton(container);
        addANewSubobject(container);
        const card = getSubobjectCards(container, { expectedNumbersOfCards: [2] })[0][1];
        clickSubobjectCardDataTabButton(card);
        fireEvent.change(getByPlaceholderText(card, "Link"), { target: { value: "new link value" }});
        await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toBe("new link value"));

        // Click save button and check if error message is displayed and save did not occur
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => getByText(container, "Object name is required.", { exact: false }));
    });


    test("Composite object a with an existing subobject with incorrect data", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
        });

        // Wait for object and its subobject to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));

        // Modify existing subobject's data to become invalid
        clickDataTabButton(container);
        const card = getSubobjectCards(container, { expectedNumbersOfCards: [1] })[0][0];
        clickSubobjectCardDataTabButton(card);
        fireEvent.change(getByPlaceholderText(card, "Link"), { target: { value: "" }});
        await waitFor(() => expect(store.getState().editedObjects[card.id].link.link).toBe(""));

        // Click save button and check if error message is displayed and save did not occur
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => getByText(container, "Valid URL is required.", { exact: false }));
        expect(store.getState().links[card.id].link).not.toEqual("");
    });
});


describe("Update object", () => {
    test("Update a link object + check all attributes update", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
    
        // Modify attributes
        fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("modified object name"));
        fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("modified object description"));
    
        // Modify data
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        fireEvent.change(linkInput, { target: { value: "https://test.link.modified" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe("https://test.link.modified"));

        // Publish object
        expect(store.getState().editedObjects[1].is_published).toBeFalsy();
        clickDisplayTabButton(container);
        clickPublishObjectCheckbox(container);
        expect(store.getState().editedObjects[1].is_published).toBeTruthy();
    
        //  Save object
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[1].object_name).toEqual("modified object name"));
        expect(store.getState().objects[1].object_description).toEqual("modified object description");
        expect(store.getState().objects[1].is_published).toBeTruthy();
        expect(store.getState().links[1].link).toEqual("https://test.link.modified");
    });
    

    test("Update a markdown object", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1001"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
    
        // Modify attributes
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("modified object name"));
        fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("modified object description"));
        
        // Modify data
        clickDataTabButton(container);
        const markdownContainer = document.querySelector(".markdown-editor-container");
        expect(markdownContainer).toBeTruthy();
        let bothModeButton = getByTitle(markdownContainer, "Display edit window and parsed markdown");
        fireEvent.click(bothModeButton);
        let inputForm = getByPlaceholderText(markdownContainer, "Enter text here...");
        fireEvent.change(inputForm, { target: { value: "# Modified Markdown" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).markdown.raw_text).toBe("# Modified Markdown"));
    
        // Save object    
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[1001].object_name).toEqual("modified object name"));
        expect(store.getState().objects[1001].object_description).toEqual("modified object description");
        expect(store.getState().markdown[1001].raw_text).toEqual("# Modified Markdown");
    });
    

    test("Update a to-do list object", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/2001"
        });
    
        // Wait for object information to be displayed on the page
        await waitFor(() => getByText(container, "Object Information"));
        let saveButton = getSideMenuItem(container, "Save");
    
        // Modify attributes
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        fireEvent.change(objectNameInput, { target: { value: "modified object name" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("modified object name"));
        fireEvent.change(objectDescriptionInput, { target: { value: "modified object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("modified object description"));
    
        // Modify data
        clickDataTabButton(container);
        const TDLContainer = container.querySelector(".to-do-list-container");
        expect(TDLContainer).toBeTruthy();
        let newItemInput = getByPlaceholderText(TDLContainer, "New item");
        const newItemIndex = Math.max(...getCurrentObject(store.getState()).toDoList.itemOrder) + 1;
        fireEvent.input(newItemInput, { target: { innerHTML: "new to-do list item" }});
        await waitFor(() => expect(getCurrentObject(store.getState()).toDoList.items[newItemIndex].item_text).toBe("new to-do list item"));
    
        // Save object
        fireEvent.click(saveButton);
        await waitFor(() => expect(store.getState().objects[2001].object_name).toEqual("modified object name"));
        expect(store.getState().objects[2001].object_description).toEqual("modified object description");
        expect(store.getState().toDoLists[2001].items[newItemIndex].item_text).toEqual("new to-do list item");
    });


    test("Update a composite object", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/3001"
        });

        // Wait for object and its subobject to load
        await waitFor(() => getByText(container, "Object Information"));
        await waitFor(() => expect(store.getState().editedObjects).toHaveProperty(Object.keys(store.getState().editedObjects[3001].composite.subobjects)[0]));

        // Modify object name
        const updatedObjectName = "Updated object name";
        fireEvent.change(getByPlaceholderText(container, "Object name"), { target: { value: updatedObjectName } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe(updatedObjectName));

        // Add 3 new & 3 existing subobjects
        clickDataTabButton(container);
        addANewSubobject(container);
        addANewSubobject(container);
        addANewSubobject(container);
        await addAnExistingSubobject(container, 0, "fully deleted existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "unmodified existing", store, { waitForObjectLoad: true });
        await addAnExistingSubobject(container, 0, "existing to be modified", store, { waitForObjectLoad: true });
        let cards = getSubobjectCards(container, { expectedNumbersOfCards: [7] });
        const [deletedExistingID, deletedNewID, firstNewID, secondNewID, fullyDeletedExistingID, unmodifiedExistingID, modifiedExistingID] = cards[0].map(card => card.id);

        // Delete 2 subobjects (existing + new), fully delete 1 existing subobject
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][0]).deleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][1]).deleteButton);
        fireEvent.click(getSubobjectCardMenuButtons(cards[0][4]).fullDeleteButton);

        // Modify new subobjects
        const firstNewName = "first new subobject", firstLink = "http://first.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][2]).subobjectNameInput, { target: { value: firstNewName } });
        await waitFor(() => expect(store.getState().editedObjects[firstNewID].object_name).toEqual(firstNewName));
        clickSubobjectCardDataTabButton(cards[0][2]);
        fireEvent.change(getByPlaceholderText(cards[0][2], "Link"), { target: { value: firstLink }});
        await waitFor(() => expect(store.getState().editedObjects[firstNewID].link.link).toEqual(firstLink));
        clickSubobjectCardDisplayTabButton(cards[0][2]);
        clickPublishObjectCheckbox(cards[0][2]);
        expect(store.getState().editedObjects[firstNewID].is_published).toBeTruthy();

        const secondNewName = "second new subobject", secondLink = "http://second.link";
        fireEvent.change(getSubobjectCardAttributeElements(cards[0][3]).subobjectNameInput, { target: { value: secondNewName } });
        await waitFor(() => expect(store.getState().editedObjects[secondNewID].object_name).toEqual(secondNewName));
        clickSubobjectCardDataTabButton(cards[0][3]);
        fireEvent.change(getByPlaceholderText(cards[0][3], "Link"), { target: { value: secondLink }});
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
        await waitFor(() => expect(store.getState().editedObjects[3001].composite.subobjects[modifiedExistingID].is_expanded).toBeFalsy());

        // Click save button and wait for the object to be updated
        fireEvent.click(getSideMenuItem(container, "Save"));
        await waitFor(() => expect(store.getState().objects[3001].object_name).toEqual(updatedObjectName));
        const object_id = 3001;
        const state = store.getState();
        
        // Check updated composite object (has 4 subobjects in both editedObjects & composite storages)
        const strObjectID = object_id.toString();
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
        // NOTE: `modified_at` value depends on backend value & can be different in mock backends
        expect(state.editedObjects[modifiedExistingID].modified_at).toEqual(state.objects[modifiedExistingID].modified_at);
        // expect(state.editedObjects[modifiedExistingID].modified_at).toEqual(state.objects[object_id].modified_at);
        // expect(state.objects[modifiedExistingID].modified_at).toEqual(state.objects[object_id].modified_at);
        expect(state.composite[object_id].subobjects[modifiedExistingID].is_expanded).toBeFalsy();

        // // Rows of non-deleted subobjects are updated
        // // NOTE: row values are generated by backend & not updated in /objects/bulk_upsert mock route handler
        // for (let subobjectsStorage of [state.composite[object_id].subobjects, state.editedObjects[object_id].composite.subobjects]) {
        //     expect(subobjectsStorage[getMappedSubobjectID(firstNewID, "link")].row).toEqual(0);
        //     expect(subobjectsStorage[getMappedSubobjectID(secondNewID, "link")].row).toEqual(1);
        //     expect(subobjectsStorage[unmodifiedExistingID].row).toEqual(2);
        //     expect(subobjectsStorage[modifiedExistingID].row).toEqual(3);
        // }

        // Subobject cards are rendered
        clickDataTabButton(container);
        cards = getSubobjectCards(container, { expectedNumbersOfCards: [4] });
        const expectedCardIDs = [getMappedSubobjectID(firstNewID, "link"), getMappedSubobjectID(secondNewID, "link"), unmodifiedExistingID, modifiedExistingID];
        for (let i = 0; i < 4; i++) expect(cards[0][i].id).toEqual(expectedCardIDs[i].toString());
    });
});
