import React from "react";
import { Switch, Route } from "react-router-dom";

import { fireEvent } from "@testing-library/react";
import { getByText, getByPlaceholderText, waitFor, getByTitle } from "@testing-library/dom";

import { createTestStore } from "../_util/create-test-store";
import { renderWithWrappers } from "../_util/render";
import { getSideMenuDialogControls, getSideMenuItem } from "../_util/ui-common";
import { getInlineInputField, getDropdownOptionsContainer, getTagInlineItem } from "../_util/ui-objects-tags";
import { getCurrentObject, clickDataTabButton, clickGeneralTabButton, resetObject } from "../_util/ui-objects-edit";

import { App } from "../../src/components/top-level/app";
import ObjectsList from "../../src/components/top-level/objects-list";
import { setObjectsTags } from "../../src/actions/data-tags";
import { getNonCachedTags } from "../../src/fetches/data-tags";
import { addObjects, addObjectData } from "../../src/actions/data-objects";
import { generateObjectAttributes, generateObjectData } from "../_mocks/data-objects";


/*
    Object tagging tests for /objects/edit/:id page.
*/
beforeEach(() => {
    // isolate fetch mock to avoid tests state collision because of cached data in fetch
    jest.isolateModules(() => {
        const { mockFetch, setFetchFail } = require("../_mocks/mock-fetch");
        // reset fetch mocks
        jest.resetAllMocks();
        global.fetch = jest.fn(mockFetch);
        global.setFetchFail = jest.fn(setFetchFail);
    });
});



describe("Add object page", () => {
    test("Check tag input elements", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });
    
        // Input is not rendered by default
        expect(getInlineInputField({ container })).toBeFalsy();
    
        // Click the tag input toggle icon
        let inputToggle = getByTitle(container, "Click to add tags");
        expect(inputToggle).toBeTruthy();
        fireEvent.click(inputToggle);
    
        // Check if input is rendered
        let input = getInlineInputField({ container });
    
        // Change input value
        fireEvent.change(input, { target: { value: "some text" } });
        expect(store.getState().objectUI.tagsInput.inputText).toEqual("some text");
    
        // Click Escape & check if input is not rendered
        fireEvent.keyDown(input, { key: "Escape", code: "Escape" });
        expect(getInlineInputField({ container })).toBeFalsy();
    });
    
    
    test("Check input dropdown", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });
    
        // Change input text
        let inputToggle = getByTitle(container, "Click to add tags");
        fireEvent.click(inputToggle);
        let input = getInlineInputField({ container });
        fireEvent.change(input, { target: { value: "some text" } });
    
        // Check if filtered options appeared
        await waitFor(() => {
            expect(store.getState().objectUI.tagsInput.matchingIDs.length).toEqual(10);
            let dropdown = getDropdownOptionsContainer({ container, currentQueryText: "some text" });
            expect(dropdown).toBeTruthy();
            // expect(dropdown.childNodes.length).toEqual(11); // add new + 10 existing tags    // dropdown list <div> tags are not rendered in tests, despite the options being passed into Dropdown component
        });
    });
    
    
    test("Add & remove tags", async () => {
        let { store, container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });
    
        let inputToggle = getByTitle(container, "Click to add tags");
        expect(inputToggle).toBeTruthy();
        fireEvent.click(inputToggle);
        let input = getInlineInputField({ container });
    
        // Add and remove an "existing" tag
        fireEvent.change(input, { target: { value: "tag #1" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
        let addedTag = getTagInlineItem({ container, text: "tag #1" });
        expect(addedTag).toBeTruthy();
        expect(input.value).toEqual("");
        fireEvent.click(addedTag);
        expect(getTagInlineItem({ container, text: "tag #1" })).toBeFalsy();
        
        // Add and remove a new tag
        fireEvent.change(input, { target: { value: "new tag" } });
        await waitFor(() => expect(store.getState().objectUI.tagsInput.matchingIDs.length).toEqual(10));
        let dropdown = getDropdownOptionsContainer({ container, currentQueryText: "new tag" });
        expect(dropdown).toBeTruthy();
        fireEvent.click(dropdown.childNodes[0]);    // click on "Add new tag" option
        addedTag = getTagInlineItem({ container, text: "new tag" });
        expect(addedTag).toBeTruthy();
        fireEvent.click(addedTag);
        expect(getTagInlineItem({ container, text: "new tag" })).toBeFalsy();
    });


    test("Reset tags", async () => {
        let { store, container } = renderWithWrappers(<App />, {
            route: "/objects/edit/new"
        });

        // Add an "existing" tag
        const inputToggle = getByTitle(container, "Click to add tags");
        expect(inputToggle).toBeTruthy();
        fireEvent.click(inputToggle);
        const input = getInlineInputField({ container });
        
        const tagText = "new tag";
        fireEvent.change(input, { target: { value: tagText } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        expect(getTagInlineItem({ container, text: tagText })).toBeTruthy();

        // Reset a check if added tag was removed
        resetObject(container);

        expect(getTagInlineItem({ container, text: tagText })).toBeFalsy();
        expect(getCurrentObject(store.getState()).addedTags.length).toEqual(0);
    });


    test("Persist added tags", async () => {
        // Render switch with /objects/edit/:id and /objects page at /objects/edit/new
        let { container, store } = renderWithWrappers(<App />
        , { route: "/objects/edit/new" });

        // Add a tag
        const inputToggle = getByTitle(container, "Click to add tags");
        expect(inputToggle).toBeTruthy();
        fireEvent.click(inputToggle);
        const input = getInlineInputField({ container });
        
        const tagText = "new tag";
        fireEvent.change(input, { target: { value: tagText } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        expect(getTagInlineItem({ container, text: tagText })).toBeTruthy();

        // Get to /objects page and back
        const cancelButton = getSideMenuItem(container, "Cancel");
        fireEvent.click(cancelButton);
        await waitFor(() => getByText(container, "object #1"));

        const addObjectButton = getSideMenuItem(container, "Add a New Object");
        fireEvent.click(addObjectButton);

        // Check if added tag is displayed
        expect(getTagInlineItem({ container, text: tagText })).toBeTruthy();
        expect(getCurrentObject(store.getState()).addedTags.length).toEqual(1);
    });
    
    
    test("Add tags & save object", async () => {
        let { container, history, store } = renderWithWrappers(<App />, 
            { route: "/objects/edit/new" }
        );
    
        let inputToggle = getByTitle(container, "Click to add tags");
        expect(inputToggle).toBeTruthy();
        fireEvent.click(inputToggle);
        let input = getInlineInputField({ container });
    
        // // Add an "existing" tag
        fireEvent.change(input, { target: { value: "tag #1" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
        expect(getTagInlineItem({ container, text: "tag #1" })).toBeTruthy();
    
        // // Add a new tag
        fireEvent.change(input, { target: { value: "new tag" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });  // check enter key down handle
        expect(getTagInlineItem({ container, text: "new tag" })).toBeTruthy();
    
        // Set object attributes
        let objectNameInput = getByPlaceholderText(container, "Object name");
        let objectDescriptionInput = getByPlaceholderText(container, "Object description");
        fireEvent.change(objectNameInput, { target: { value: "new object" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_name).toBe("new object"));
        fireEvent.change(objectDescriptionInput, { target: { value: "new object description" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).object_description).toBe("new object description"));
    
        // Set object data
        clickDataTabButton(container);
        let linkInput = getByPlaceholderText(container, "Link");
        fireEvent.change(linkInput, { target: { value: "https://google.com" } });
        await waitFor(() => expect(getCurrentObject(store.getState()).link.link).toBe("https://google.com"));
    
        // Save object
        let saveButton = getSideMenuItem(container, "Save");   
        fireEvent.click(saveButton);
        const object_id = 1000; // mock object returned has this id
    
        // Wait for redirect and tag fetch
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe(`/objects/edit/${object_id}`));
        clickGeneralTabButton(container);
        await waitFor(() => expect(container.querySelector(".inline-item-list-wrapper").childNodes.length).toEqual(3)); // 2 tags + input
    });
});


describe("Edit object page", () => {
    test("Load object tags from state", async () => {
        let store = createTestStore({ enableDebugLogging: false });
        let object = generateObjectAttributes(1, {
            object_type: "link", object_name: "object name", object_description: "object description", 
            created_at: (new Date(Date.now() - 24*60*60*1000)).toUTCString(), modified_at: (new Date()).toUTCString(), current_tag_ids: [1, 2, 3, 4, 5] 
        });
        let objectData = generateObjectData(1, "link", { "link": "https://test.link" });
        store.dispatch(addObjects([object]));
        store.dispatch(setObjectsTags([object]));
        store.dispatch(addObjectData([objectData]));
        for (let tag_id of object.current_tag_ids)
            await store.dispatch(getNonCachedTags([tag_id]));
        
        let { container } = renderWithWrappers(<App />, {
            route: "/objects/edit/1",
            store: store
        });
    
        // Check if tags are rendered on the page
        await waitFor(() => expect(container.querySelector(".inline-item-list-wrapper").childNodes.length).toBeGreaterThan(1));
        for(let i = 1; i <= 5; i++)
            getByText(container, `tag #${i}`);
    });
    
    
    test("Load object tags from backend & test tag removal", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
    
        // Check if tags are rendered on the page
        await waitFor(() => expect(container.querySelector(".inline-item-list-wrapper").childNodes.length).toBeGreaterThan(1));
        for(let i = 1; i <= 5; i++) getByText(container, `tag #${i}`);
        
        // Check tag removal
        let tag = getByText(container, "tag #1");
        fireEvent.click(tag);
        expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeTruthy();
        fireEvent.click(tag);
        expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeFalsy();
    });
    
    
    test("Load object tags from backend, add tags and update the object", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
    
        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));
        let inputToggle = getByTitle(container, "Click to add tags");
        expect(inputToggle).toBeTruthy();
        fireEvent.click(inputToggle);
        let input = getInlineInputField({ container });
    
        // Add an "existing" tag
        fireEvent.change(input, { target: { value: "tag #6" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    
        // Add a new tag
        fireEvent.change(input, { target: { value: "new tag" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    
        let deletedTag = getTagInlineItem({ container, text: "tag #1" });
        fireEvent.click(deletedTag);
    
        // Update the tag and check if tags are updated
        let saveButton = getSideMenuItem(container, "Save");
        fireEvent.click(saveButton);
    
        await waitFor(() => getCurrentObject(store.getState()).currentTagIDs.includes(6));
        expect(getTagInlineItem({ container, text: "tag #1" })).toBeFalsy();
        for(let i = 2; i <= 6; i++) expect(getTagInlineItem({ container, text: `tag #${i}` })).toBeTruthy();
        expect(getTagInlineItem({ container, text: "new tag" })).toBeTruthy();
    });
    
    
    test("Check adding current tags with tag input", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
    
        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));
    
        // Add a current tag with input => check if it's toggled for removal
        let inputToggle = getByTitle(container, "Click to add tags");
        fireEvent.click(inputToggle);
        let input = getInlineInputField({ container });
        fireEvent.change(input, { target: { value: "tag #1" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeTruthy();
    
        // Add the same tag again => check if it's no longer removed
        fireEvent.change(input, { target: { value: "tag #1" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        expect(getCurrentObject(store.getState()).removedTagIDs.includes(1)).toBeFalsy();
    });
    
    
    test("Delete object", async () => {
        let { container, store, history } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });
    
        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));
        expect(store.getState().objectsTags.hasOwnProperty("1")).toBeTruthy();
    
        // Delete the object and check if its tags were removed
        let deleteButton = getSideMenuItem(container, "Delete");
        fireEvent.click(deleteButton);
        fireEvent.click(getSideMenuDialogControls(container).buttons["Yes"]);
    
        await waitFor(() => expect(store.getState().objectsTags[1]).toBeUndefined());
        await waitFor(() => expect(history.entries[history.length - 1].pathname).toBe("/objects/list"));
    });


    test("Reset added & removed tags", async () => {
        let { container, store } = renderWithWrappers(<App />, {
            route: "/objects/edit/1"
        });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));
        const inputToggle = getByTitle(container, "Click to add tags");
        expect(inputToggle).toBeTruthy();
        fireEvent.click(inputToggle);
        const input = getInlineInputField({ container });
    
        // Add a tag
        const tagText = "new tag";
        fireEvent.change(input, { target: { value: tagText } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        expect(getCurrentObject(store.getState()).addedTags.length).toEqual(1);

        // Remove a tag
        const deletedTag = getTagInlineItem({ container, text: "tag #1" });
        fireEvent.click(deletedTag);
        expect(getCurrentObject(store.getState()).removedTagIDs.length).toEqual(1);

        // Reset a check if added tag was removed
        resetObject(container);

        expect(getTagInlineItem({ container, text: tagText })).toBeFalsy();
        expect(getCurrentObject(store.getState()).addedTags.length).toEqual(0);
        expect(getCurrentObject(store.getState()).removedTagIDs.length).toEqual(0);
    });


    test("Persist added and removed tags", async () => {
        // Render switch with /objects/edit/:id and /objects page at /objects/edit/new
        let { container, store, history } = renderWithWrappers(
            <Switch>
                <Route exact path="/objects/list"><ObjectsList /></Route>
                <App />
            </Switch>
        , { route: "/objects/edit/1" });

        // Wait for the page to load
        await waitFor(() => getByText(container, "Object Information"));
        let inputToggle = getByTitle(container, "Click to add tags");
        expect(inputToggle).toBeTruthy();
        fireEvent.click(inputToggle);
        const input = getInlineInputField({ container });

        // Add a tag
        const tagText = "new tag";
        fireEvent.change(input, { target: { value: tagText } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        expect(getTagInlineItem({ container, text: tagText })).toBeTruthy();

        // Remove a tag
        const deletedTag = getTagInlineItem({ container, text: "tag #1" });
        fireEvent.click(deletedTag);
        expect(getCurrentObject(store.getState()).removedTagIDs.length).toEqual(1);

        // Get to /objects/list page and back
        const cancelButton = getSideMenuItem(container, "Cancel");
        fireEvent.click(cancelButton);

        history.push("/objects/edit/1");
        // await waitFor(() => getByText(container, "object #1"));
        // fireEvent.click(getByText(container, "object #1"));
        await waitFor(() => getByText(container, "Object Information"));

        // Check if added and removed tags are displayed
        expect(getTagInlineItem({ container, text: tagText })).toBeTruthy();
        expect(getCurrentObject(store.getState()).addedTags.length).toEqual(1);
        expect(getCurrentObject(store.getState()).removedTagIDs.length).toEqual(1);
    });
});

